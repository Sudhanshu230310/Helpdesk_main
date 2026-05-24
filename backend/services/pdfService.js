const PDFDocument = require('pdfkit');

const generateReportPdf = (categoryData, subcategoryData, techData) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const buffers = [];
            
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // Header - Generate Timestamp
            const timestamp = new Date().toLocaleString();
            doc.fontSize(20).text('Helpdesk Performance Report', { align: 'center' });
            doc.fontSize(10).text(`Generated Timestamp: ${timestamp}`, { align: 'center' });
            doc.moveDown(2);

            // Helper to draw a section
            const drawSection = (title, data, columns) => {
                doc.fontSize(14).text(title, { underline: true });
                doc.moveDown(0.5);

                if (data.length === 0) {
                    doc.fontSize(10).text('No data available.', { font: 'Helvetica-Oblique' });
                    doc.moveDown();
                    return;
                }

                // Simple table rendering
                let y = doc.y;
                doc.fontSize(10).font('Helvetica-Bold');
                
                columns.forEach((col, i) => {
                    doc.text(col.header, 50 + (i * 120), y);
                });
                
                y += 15;
                doc.font('Helvetica');

                data.forEach(row => {
                    if (y > 700) {
                        doc.addPage();
                        y = 50;
                    }
                    columns.forEach((col, i) => {
                        let text = String(row[col.key] || '0');
                        doc.text(text, 50 + (i * 120), y);
                    });
                    y += 15;
                });
                
                doc.y = y + 20;
            };

            // Category Section
            drawSection('By Category', categoryData, [
                { header: 'Category', key: 'category_name' },
                { header: 'Total', key: 'total_tickets' },
                { header: 'Closed', key: 'closed_tickets' },
                { header: 'Avg Hrs', key: 'avg_resolution_hours' }
            ]);

            // Subcategory Section
            drawSection('By Subcategory', subcategoryData, [
                { header: 'Subcategory', key: 'subcategory_name' },
                { header: 'Category', key: 'category_name' },
                { header: 'Total', key: 'total_tickets' },
                { header: 'Closed', key: 'closed_tickets' }
            ]);

            // Technician Section
            drawSection('By Technician', techData, [
                { header: 'Category', key: 'category_name' },
                { header: 'Technician', key: 'technician_name' },
                { header: 'Total', key: 'total_tickets' },
                { header: 'Closed', key: 'closed_tickets' }
            ]);

            // Add Footer with Page Numbers
            const pages = doc.bufferedPageRange();
            for (let i = 0; i < pages.count; i++) {
                doc.switchToPage(i);
                doc.fontSize(8);
                doc.text(
                    `Time generated: border - Page ${i + 1} of ${pages.count}`,
                    50,
                    doc.page.height - 50,
                    { align: 'center' }
                );
            }

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { generateReportPdf };
