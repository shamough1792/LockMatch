// routes/insights.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const connection = require('../db/connection');
// 引入 DeepSeek 客戶端
const { initDeepSeekAI } = require('../config/deepseekAI');

const deepseekAI = initDeepSeekAI();

function queryPromise(sql, params) {
    return new Promise((resolve, reject) => {
        connection.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
}

// GET /api/insights/report
router.get('/report', authMiddleware(process.env.JWT_SECRET), async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. 獲取用戶MBTI歷史
        const mbtiHistory = await queryPromise(
            'SELECT mbti_type, created_at FROM mbti_history WHERE user_id = ? ORDER BY created_at',
            [userId]
        );

        // 2. 獲取聊天統計
        const chatStats = await queryPromise(`
            SELECT 
                u.mbti AS friend_mbti,
                COUNT(*) AS message_count
            FROM messages m
            JOIN chat_room_members crm1 ON m.room_id = crm1.room_id AND crm1.user_id = ?
            JOIN chat_room_members crm2 ON m.room_id = crm2.room_id AND crm2.user_id != ?
            JOIN users u ON crm2.user_id = u.id
            WHERE m.sender_id = ?
                AND u.mbti IS NOT NULL
            GROUP BY u.mbti
            ORDER BY message_count DESC
        `, [userId, userId, userId]);

        // 3. 活躍時段統計
        const activeHours = await queryPromise(`
            SELECT HOUR(created_at) AS hour, COUNT(*) AS count
            FROM messages
            WHERE sender_id = ?
            GROUP BY HOUR(created_at)
            ORDER BY count DESC
        `, [userId]);

        // 4. 話題成功率
        const topicSuccess = await queryPromise(`
            SELECT 
                COUNT(DISTINCT m1.id) AS total_messages,
                COUNT(DISTINCT m2.id) AS replied_messages
            FROM messages m1
            LEFT JOIN messages m2 
                ON m1.room_id = m2.room_id 
                AND m2.sender_id != m1.sender_id 
                AND m2.created_at > m1.created_at 
                AND m2.created_at < DATE_ADD(m1.created_at, INTERVAL 1 DAY)
            WHERE m1.sender_id = ?
        `, [userId]);

        // 5. 最近7篇日記
        const recentDiaries = await queryPromise(`
            SELECT content, created_at FROM daily_journals WHERE user_id = ? ORDER BY created_at DESC LIMIT 7
        `, [userId]);

        // 6. 最近發帖
        const posts = await queryPromise(`
            SELECT content, created_at FROM posts WHERE user_id = ? ORDER BY created_at DESC LIMIT 10
        `, [userId]);

        // 準備資料文字
        const mbtiHistoryText = mbtiHistory.map(m => `${m.created_at}: ${m.mbti_type}`).join('\n');
        const chatStatsText = chatStats.map(c => `${c.friend_mbti}: ${c.message_count} 次`).join('\n');
        const activeHourText = activeHours.map(a => `${a.hour} 時: ${a.count} 條消息`).join('\n');
        const successRate = topicSuccess[0]?.total_messages
            ? ((topicSuccess[0].replied_messages / topicSuccess[0].total_messages) * 100).toFixed(1)
            : 0;
        const diaryText = recentDiaries.map(d => `${d.created_at}: ${d.content}`).join('\n');
        const postText = posts.map(p => p.content).join('\n');

        const systemPrompt = `你係一個專業嘅社交洞察分析師，擅長根據用戶數據生成 MBTI 社交報告。
重要規則：
- **全部使用繁體中文**回覆（香港用語風格）
- 語氣要親切、有趣、鼓勵
- 請嚴格按照以下格式輸出：

【性格趨勢】
...
【交友報告】
• 最常傾偈嘅MBTI：...
• 活躍時間：...
• 話題成功率：...%
【小貼士】
...`;

        const userPrompt = `
用戶MBTI歷史：
${mbtiHistoryText || '未有記錄'}

最近日記：
${diaryText || '未有日記'}

最近發帖：
${postText || '未有發帖'}

與不同MBTI好友聊天次數：
${chatStatsText || '未有數據'}

活躍時段統計：
${activeHourText || '未有數據'}

話題成功率：${successRate}%

請根據以上資料生成一份完整報告。`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];

        // 呼叫 DeepSeek
        console.log('📤 呼叫 DeepSeek 生成洞察報告...');
        const result = await deepseekAI.invoke(messages, {
            thinking: { type: "enabled" },
            temperature: 0.6
        });
        const report = result.content;

        res.json({
            success: true,
            report,
            stats: {
                chatStats,
                activeHours,
                successRate,
                mbtiHistory
            }
        });

    } catch (error) {
        console.error('❌ 生成報告錯誤:', error);
        res.status(500).json({ success: false, error: '伺服器錯誤' });
    }
});

// 提交日記並獲取AI分析
router.post('/diary', authMiddleware(process.env.JWT_SECRET), async (req, res) => {
    try {
        const { content, mood } = req.body;
        const userId = req.user.id;

        if (!content) {
            return res.status(400).json({ success: false, error: '請輸入日記內容' });
        }

        const insertDiary = 'INSERT INTO daily_journals (user_id, content, mood) VALUES (?, ?, ?)';
        connection.query(insertDiary, [userId, content, mood || null], async (err) => {
            if (err) {
                console.error('❌ 儲存日記失敗:', err);
                return res.status(500).json({ success: false, error: '日記儲存失敗' });
            }

            const diaryQuery = `
                SELECT content, DATE(created_at) as date
                FROM daily_journals
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT 7
            `;
            connection.query(diaryQuery, [userId], async (err, diaries) => {
                if (err) console.error('❌ 獲取日記歷史失敗:', err);

                const mbtiQuery = 'SELECT mbti_type, created_at FROM mbti_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 5';
                connection.query(mbtiQuery, [userId], async (err, mbtiHistory) => {
                    const diaryText = diaries.map(d => `${d.date}: ${d.content}`).join('\n');
                    const mbtiText = mbtiHistory.map(m => `${m.created_at}: ${m.mbti_type}`).join('\n');

                    const systemPrompt = `你係一個擅長分析 MBTI 性格嘅心理學助手。請用**繁體中文**（香港風格），親切有禮地分析用戶今日日記，指出可能嘅 MBTI 傾向，並給出一句實用嘅放鬆或改善建議。`;

                    const userPrompt = `今日日記：${content}\n\n最近日記：${diaryText}\n\nMBTI歷史：${mbtiText}`;

                    try {
                        const messages = [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: userPrompt }
                        ];
                        const result = await deepseekAI.invoke(messages, {
                            thinking: { type: "enabled" },
                            temperature: 0.7
                        });

                        res.json({
                            success: true,
                            analysis: result.content,
                            diarySaved: true
                        });
                    } catch (aiError) {
                        console.error('❌ AI 分析錯誤:', aiError);
                        res.json({ success: true, message: '日記已儲存，但AI分析暫時不可用' });
                    }
                });
            });
        });
    } catch (error) {
        console.error('❌ 日記API錯誤:', error);
        res.status(500).json({ success: false, error: '伺服器錯誤' });
    }
});

module.exports = router;