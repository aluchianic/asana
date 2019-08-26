'use strict';

const AsanaManager = require('./asana-manager');

(async () => {
  try {
    const Asana = new AsanaManager();

    const include = "id, assignee, assignee_status, created_at, completed, completed_at, due_on, due_at, external, followers, hearted, hearts, modified_at, name, notes, num_hearts, projects, parent, workspace, memberships";
    const expand = "id, assignee, assignee_status, created_at, completed, completed_at, due_on, due_at, external, followers, hearted, hearts, modified_at, name, notes, num_hearts, projects, parent, workspace, memberships";

    const tasks = await Asana.getAllCompanyTasks("name, created_at, workspace");
    const result = await Asana.updateTasks(tasks);

    process.exit(0);
  } catch (err) {
    console.error(err.message || err);
    process.exit(1);
  }
})();
