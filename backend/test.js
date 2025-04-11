import schedule from 'node-schedule'
import { supabase } from './config/supabase.js';
import { scheduledJobsMap } from './index.js';
// import {schedulePostHandler} from './controllers/instagram.controller.js' ;
const scheduledJobs = new Map(); // Store jobs with an ID for management


// function to load scheduled jobs 
const loadScheduledJobs = async () => {
    try{
    const { data, error } = await supabase
    .from('scheduled_posts')
    .select('*')
    .order('scheduled_for', { ascending: true });
    if(error) {
        throw error ; 
    }
    // console.log("Data = " , data) ; 
    if(data) 
    {
      data.map((job) => {
        if(!scheduledJobsMap.has(job?.id))
        {
            scheduledJobsMap.set(job?.id , {...job}) 
        }
    })
    }
    return data ; 
    }
    catch(err) 
    {
        console.log(err) ;
        return null ; 
    }
}
async function updateScheduledPost(id, updates) {
    const { data, error } = await supabase
      .from('scheduled_posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
  
    if (error) throw error;
} 


export {loadScheduledJobs , updateScheduledPost} 










// Schedule a job at a specific date/time
// function scheduleJob(jobId, date, callback) {
//     if (scheduledJobs.has(jobId)) {
//         console.log(`Job ${jobId} already exists. Rescheduling...`);
//         deleteJob(jobId);
//     }
    
//     const job = schedule.scheduleJob(date, callback);
//     scheduledJobs.set(jobId, job);
//     console.log(`Scheduled job ${jobId} at ${date}`);
// }

// // Delete a scheduled job
// function deleteJob(jobId) {
//     const job = scheduledJobs.get(jobId);
//     if (job) {
//         job.cancel();
//         scheduledJobs.delete(jobId);
//         console.log(`Deleted job ${jobId}`);
//     }
// }

// // Reschedule a job
// function rescheduleJob(jobId, newDate, callback) {
//     deleteJob(jobId);
//     scheduleJob(jobId, newDate, callback);
// }

// // Example usage:
// const jobId = "job1";
// const jobDate = new Date(Date.now() + 60000); // 1 minute later
// scheduleJob(jobId, jobDate, () => console.log(`Executing scheduled job ${jobId}`));

// setTimeout(() => {
//     const newJobDate = new Date(Date.now() + 120000); // 2 minutes later
//     rescheduleJob(jobId, newJobDate, () => console.log(`Executing rescheduled job ${jobId}`));
// }, 30000); // Reschedule after 30 seconds
