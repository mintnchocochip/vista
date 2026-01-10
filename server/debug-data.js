import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from './models/projectSchema.js';
import MasterData from './models/masterDataSchema.js';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        console.log('\n--- Unique Project Values ---');
        const uniqueSchools = await Project.distinct('school');
        const uniquePrograms = await Project.distinct('program');
        const uniqueYears = await Project.distinct('academicYear');

        console.log('Schools in Projects:', uniqueSchools);
        console.log('Programs in Projects:', uniquePrograms);
        console.log('AcademicYears in Projects:', uniqueYears);

        console.log('\n--- Master Data ---');
        const masterData = await MasterData.findOne();
        if (masterData) {
            console.log('MasterData Schools:', masterData.schools.map(s => s.code));
            console.log('MasterData Programs:', masterData.programs.map(p => p.name)); // name corresponds to what is likely shown in dropdown
            console.log('MasterData Years:', masterData.academicYears.map(y => y.year));
        } else {
            console.log('No Master Data found.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
