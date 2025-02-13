const scheduledJobs = new Map(); // Store jobs by ID

function scheduleJob(jobId, date) {
    if (scheduledJobs.has(jobId)) {
        console.log(`Job ${jobId} already exists. Rescheduling...`);
        deleteJob(jobId);
    }

    const job = schedule.scheduleJob(date, () => {
        console.log(`Executing job ${jobId} at ${new Date()}`);
    });

    scheduledJobs.set(jobId, job);
    console.log(`Scheduled job ${jobId} at ${date}`);
}

function deleteJob(jobId) {
    if (scheduledJobs.has(jobId)) {
        scheduledJobs.get(jobId).cancel();
        scheduledJobs.delete(jobId);
        console.log(`Deleted job ${jobId}`);
    }
}

// Example Usage:
const jobId = "job1";
const jobDate = new Date(Date.now() + 60000); // 1 minute later
scheduleJob(jobId, jobDate);

setTimeout(() => deleteJob(jobId), 30000); // Cancel after 30 seconds
