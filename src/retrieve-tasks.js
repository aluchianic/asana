'use strict';

const AsanaManager = require('./asana-manager');

(async () => {
  try {
    const Asana = new AsanaManager();

    const tasks = await Asana.getAllCompanyTasks({ includeFields: "name, created_at, workspace", limit: 100});
    const result = await Asana.updateTasks(tasks);

    console.log('Tasks names are updated.');
    process.exit(0);
  } catch (err) {
    console.error(err.message || err);
    process.exit(1);
  }
})();
