// Script to link ALL documents to appropriate standards
const db = require('./database');

async function linkAllDocuments() {
  try {
    console.log('=== LINKING ALL DOCUMENTS TO STANDARDS ===\n');
    
    // Get ALL documents without standards (including rejected)
    const [docs] = await db.query(`
      SELECT d.id, d.title, d.category_name, d.department_code, d.workflow_status, d.category_id
      FROM documents d
      WHERE d.id NOT IN (SELECT document_id FROM document_standards)
      ORDER BY d.id DESC
    `);
    
    console.log(`Found ${docs.length} documents without standards\n`);
    
    let linkedCount = 0;
    
    for (const doc of docs) {
      // Get first standard for this document's category
      const [standards] = await db.query(
        'SELECT id, name FROM standards WHERE category_id = ? AND is_active = 1 ORDER BY sort_order ASC LIMIT 1',
        [doc.category_id]
      );
      
      if (standards.length > 0) {
        const standardId = standards[0].id;
        const standardName = standards[0].name;
        
        // Link document to standard
        await db.query(
          'INSERT IGNORE INTO document_standards (document_id, standard_id) VALUES (?, ?)',
          [doc.id, standardId]
        );
        
        console.log(`✓ Doc ${doc.id}: "${doc.title}" (${doc.workflow_status}) → "${standardName}"`);
        linkedCount++;
      } else {
        console.log(`✗ Doc ${doc.id}: "${doc.title}" - No standards found for category ${doc.category_name}`);
      }
    }
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`✓ Linked ${linkedCount} documents to standards`);
    
    // Show final count
    const [finalCount] = await db.query('SELECT COUNT(*) as count FROM document_standards');
    console.log(`✓ Total document_standards records: ${finalCount[0].count}`);
    
    // Show all linked documents
    const [allLinked] = await db.query(`
      SELECT 
        d.id,
        d.title,
        d.category_name,
        d.workflow_status,
        GROUP_CONCAT(s.name SEPARATOR ', ') as standards
      FROM documents d
      INNER JOIN document_standards ds ON d.id = ds.document_id
      INNER JOIN standards s ON ds.standard_id = s.id
      GROUP BY d.id, d.title, d.category_name, d.workflow_status
      ORDER BY d.id DESC
    `);
    
    console.log(`\n=== ALL LINKED DOCUMENTS (${allLinked.length}) ===`);
    allLinked.forEach(d => {
      console.log(`  Doc ${d.id}: ${d.title} [${d.workflow_status}]`);
      console.log(`    Category: ${d.category_name}`);
      console.log(`    Standards: ${d.standards}\n`);
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

linkAllDocuments();
