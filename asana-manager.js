'use strict';

const Asana = require('asana');
const dotenv = require('dotenv').config();

class AsanaManager {
  /**
   * Thin Wrapper for Asana
   * @param {Object} [headers]
   */
  constructor(headers = false) {
    this.accessToken = AsanaManager.PTA;
    this.init(headers);
  }

  /**
   * Initialize Asana Client \w token & headers
   */
  init(headers) {
    this.client = Asana.Client
      .create(AsanaManager.setDefaultHeaders(headers))
      .useAccessToken(this.accessToken);
  }

  /**
   * e.g {
   *   "asana-enable": "string_ids,new_sections",
   *   "asana-disable": "string_ids,new_sections",
   *   "asana-change": "string_ids,new_sections"
   * }
   * @param {Object} [headers]
   * @return {Object}
   */
  static setDefaultHeaders(headers) {
    return headers
      ? { "defaultHeaders": headers}
      : { "defaultHeaders": { "asana-enable": "string_ids,new_sections" } };
  }

  static get PTA() {
    const token = process.env.PTA_KEY || false;
    if (!token) {
      throw new Error('Provide Private Access Token.');
    }

    return token;
  }
  /**
   * @return {Promise}
   */
  async getAllWorkspaces() {
    const { data: workspaces } = await this.client.workspaces.findAll();
    return workspaces;
  }

  /**
   * @param {String} gid
   * @return {Promise}
   */
  async getUsersByWorkspace(gid) {
    const { data: users } = await this.client.users.findByWorkspace(gid);
    return users;
  }

  /**
   * @param {String} gid
   * @return {Promise}
   */
  async getProjectsByWorkspace(gid) {
    const { data: projects } = await this.client.projects.findByWorkspace(gid);
    return projects;
  }

  /**
   *
   * @param {String} includeFields
   * @param {String} expandFields
   * @return {Promise}
   */
  async getAllCompanyTasks(includeFields, expandFields) {
    let result = {};
    const workspaces = await this.getAllWorkspaces();

    for (const workspace of workspaces) {
      const [users, projects] = await Promise.all(
        [this.getUsersByWorkspace(workspace.gid), this.getProjectsByWorkspace(workspace.gid)]);

      for (const user of users) {
        const { data: tasks } = await this.client.tasks.findAll(
          {
            assignee: user.gid,
            workspace: workspace.gid,
            opt_fields: includeFields,
            exp_fields: expandFields
          });

        if (tasks.length) {
          result[user.name] = tasks;
        }
      }
    }

    console.log(result);
  }
}

module.exports = AsanaManager;
