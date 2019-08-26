'use strict';

const Asana = require('asana');
const { createHash } = require('crypto');
require('dotenv').config();

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
      ? { "defaultHeaders": headers }
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
   * @param {String} [includeFields]
   * @param {String} [expandFields]
   * @return {Promise}
   */
  async getAllWorkspaces(includeFields, expandFields) {
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
   * @param {String} [includeFields]
   * @param {String} [expandFields]
   * @return {Promise}
   */
  async getAllCompanyTasks(includeFields = '', expandFields = '') {
    let result = {};
    const limit = 10;
    const workspaces = await this.getAllWorkspaces();

    for (const workspace of workspaces) {
      const projects = await this.getProjectsByWorkspace(workspace.gid);

      for (const project of projects) {
        const projectCollection = await this.client.tasks.findByProject(project.gid,
          { limit: limit, opt_fields: includeFields, opt_expand: expandFields });

        result[`tasks_${project.gid}`] = await this.collectionsIteration(projectCollection, limit, workspace.gid);
      }
    }

    return result;
  }

  /**
   * Add uniq ID to each task name. Task object sorted by Project
   * @param {Object} tasks
   * @return {Promise}
   */
  async updateTasks(tasks) {
    const keys = Object.keys(tasks);
    let promises = [];

    for (const key of keys) {
      for (const it of tasks[key]) {
        try {
          promises.push(this.client.tasks.update(it.gid,
            { name: `[${AsanaManager.createUniqId(it.created_at + it.workspace.gid)}]${it.name}` }));

          if (promises.length > 10) {
            await Promise.all(promises);
            promises = [];
          }
        } catch (err) {
          console.log(err);
        }
      }
    }

    return Promise.all(promises);
  }

  /**
   * Iterrates over Asana Collection
   * @param {Object} collection
   * @param {Number} limit
   * @param {String} workspaceId
   * @return {Promise}
   */
  async collectionsIteration(collection, limit, workspaceId) {
    try {
      const { data } = collection;
      let all = [...data];

      if (data.length === limit) {
        const result = await collection.nextPage();
        all = all.concat(await this.collectionsIteration(result, limit, workspaceId));
      }

      return all;
    } catch (err) {
      throw new Error(err);
    }
  };


  /**
   * Returns md5 hashed string
   * @param {String} text
   * @return {String}
   */
  static createUniqId(text) {
    return createHash('md5').update(text).digest('hex');
  }
}

module.exports = AsanaManager;
