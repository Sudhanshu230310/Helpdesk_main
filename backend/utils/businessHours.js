const { prisma } = require('../config/db');

// Calculate complete business hours between two dates
const calculateBusinessHours = async (startDate, endDate) => {
    // Let's fetch holidays
    const holidaysRes = await prisma.holidays.findMany();
    const holidayStrings = holidaysRes.map(r => r.holiday_date.toISOString().split('T')[0]);

    let count = 0;
    const curDate = new Date(startDate);
    const eDate = new Date(endDate || new Date());

    while (curDate <= eDate) {
        const dayOfWeek = curDate.getDay();
        const dateString = curDate.toISOString().split('T')[0];

        // 0 = Sunday, 6 = Saturday
        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayStrings.includes(dateString)) {
            count++;
        }
        curDate.setDate(curDate.getDate() + 1);
    }

    // Multiply by 24 (or 8 depending on shift) -> Let's say 24 business hours per business day
    return count * 24;
};

module.exports = { calculateBusinessHours };
