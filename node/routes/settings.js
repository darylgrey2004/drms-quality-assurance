// routes/settings.js
const express = require('express');
const router = express.Router();
const db = require('../database');
const { auth, adminAuth } = require('../middleware/auth');
const deanAuth = require('../middleware/deanAuth');

// ============================================
// GENERAL SETTINGS - Admin Only
// ============================================

// Get general settings
router.get('/general', auth, adminAuth, async (req, res) => {
    try {
        const [settings] = await db.query(
            `SELECT setting_key, setting_value 
             FROM system_settings 
             WHERE setting_key IN ('system_name', 'institution_name', 'system_email')`
        );
        
        const settingsObj = {};
        settings.forEach(s => {
            settingsObj[s.setting_key] = s.setting_value;
        });
        
        res.json(settingsObj);
    } catch (error) {
        console.error('Get general settings error:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Save general settings
router.post('/general', auth, adminAuth, async (req, res) => {
    try {
        const { systemName, institutionName, systemEmail } = req.body;
        
        const settings = [
            { key: 'system_name', value: systemName },
            { key: 'institution_name', value: institutionName },
            { key: 'system_email', value: systemEmail }
        ];
        
        for (const setting of settings) {
            await db.query(
                `INSERT INTO system_settings (setting_key, setting_value, setting_type, description) 
                 VALUES (?, ?, 'string', ?) 
                 ON DUPLICATE KEY UPDATE setting_value = ?`,
                [setting.key, setting.value, `System ${setting.key}`, setting.value]
            );
        }
        
        res.json({ msg: 'General settings saved successfully' });
    } catch (error) {
        console.error('Save general settings error:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ============================================
// WORKFLOW SETTINGS - Admin Only
// ============================================

// Get workflow settings
router.get('/workflow', auth, adminAuth, async (req, res) => {
    try {
        const [settings] = await db.query(
            `SELECT setting_key, setting_value 
             FROM system_settings 
             WHERE setting_key IN ('workflow_type', 'auto_approve_admin', 'auto_approve_dean', 'auto_approve_dept_head')`
        );
        
        const settingsObj = {
            workflowType: 'standard',
            autoApproveAdmin: false,
            autoApproveDean: false,
            autoApproveDeptHead: false
        };
        
        settings.forEach(s => {
            if (s.setting_key === 'workflow_type') {
                settingsObj.workflowType = s.setting_value;
            } else if (s.setting_key === 'auto_approve_admin') {
                settingsObj.autoApproveAdmin = s.setting_value === 'true';
            } else if (s.setting_key === 'auto_approve_dean') {
                settingsObj.autoApproveDean = s.setting_value === 'true';
            } else if (s.setting_key === 'auto_approve_dept_head') {
                settingsObj.autoApproveDeptHead = s.setting_value === 'true';
            }
        });
        
        res.json(settingsObj);
    } catch (error) {
        console.error('Get workflow settings error:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Save workflow settings
router.post('/workflow', auth, adminAuth, async (req, res) => {
    try {
        const { workflowType, autoApproveAdmin, autoApproveDean, autoApproveDeptHead } = req.body;
        
        const settings = [
            { key: 'workflow_type', value: workflowType, type: 'string' },
            { key: 'auto_approve_admin', value: String(autoApproveAdmin), type: 'boolean' },
            { key: 'auto_approve_dean', value: String(autoApproveDean), type: 'boolean' },
            { key: 'auto_approve_dept_head', value: String(autoApproveDeptHead), type: 'boolean' }
        ];
        
        for (const setting of settings) {
            await db.query(
                `INSERT INTO system_settings (setting_key, setting_value, setting_type, description) 
                 VALUES (?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE setting_value = ?`,
                [setting.key, setting.value, setting.type, `Workflow ${setting.key}`, setting.value]
            );
        }
        
        res.json({ msg: 'Workflow settings saved successfully' });
    } catch (error) {
        console.error('Save workflow settings error:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ============================================
// DOCUMENT REQUIREMENTS - Admin and Dean can view, only Admin can edit
// ============================================

// Get document requirements
router.get('/requirements', auth, deanAuth, async (req, res) => {
    try {
        const [requirements] = await db.query(
            `SELECT cr.*, c.name as category_name, d.code as department_code
             FROM category_requirements cr
             JOIN categories c ON cr.category_id = c.id
             JOIN departments d ON cr.department_id = d.id
             ORDER BY c.sort_order, d.code`
        );
        
        const grouped = {
            instruction: {},
            research: {},
            extension: {},
            employment: {}
        };
        
        requirements.forEach(req => {
            const category = req.category_name.toLowerCase();
            const dept = req.department_code.toLowerCase();
            if (grouped[category]) {
                grouped[category][dept] = req.expected_documents;
            }
        });
        
        res.json(grouped);
    } catch (error) {
        console.error('Get requirements error:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Save document requirements
router.post('/requirements', auth, adminAuth, async (req, res) => {
    try {
        const requirements = req.body; // { instruction: {beed: 45, ...}, research: {...}, ... }
        
        const categories = ['instruction', 'research', 'extension', 'employment'];
        const departments = ['beed', 'bsed', 'bsned', 'bcaed', 'bped'];
        
        for (const category of categories) {
            const [catResult] = await db.query('SELECT id FROM categories WHERE name = ?', [category]);
            if (catResult.length === 0) continue;
            const categoryId = catResult[0].id;
            
            for (const dept of departments) {
                const [deptResult] = await db.query('SELECT id FROM departments WHERE code = ?', [dept.toUpperCase()]);
                if (deptResult.length === 0) continue;
                const deptId = deptResult[0].id;
                
                const expectedDocs = requirements[category]?.[dept] || 0;
                
                await db.query(
                    `INSERT INTO category_requirements (category_id, department_id, expected_documents) 
                     VALUES (?, ?, ?) 
                     ON DUPLICATE KEY UPDATE expected_documents = ?`,
                    [categoryId, deptId, expectedDocs, expectedDocs]
                );
            }
        }
        
        res.json({ msg: 'Document requirements saved successfully' });
    } catch (error) {
        console.error('Save requirements error:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
