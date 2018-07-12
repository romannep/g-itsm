import { Form, Elements, getIn } from 'kate-client';

import { BusinessProcessItem } from 'kp-business-processes';

export default class Item extends Form {
  static path = '/task/:id';
  static title = 'Task';

  constructor(sys, params) {
    super(sys);

    this.bp = new BusinessProcessItem({ parentForm: this });

    this.init({
      actions: [
        {
          id: '1',
          type: Elements.BUTTON,
          title: 'Save',
          onClick: this.save,
        },
        {
          id: '2',
          type: Elements.BUTTON,
          title: 'Load',
          onClick: this.load,
        },
      ],
      elements: [
        {
          type: Elements.GRID,
          elements: [
            {
              type: Elements.GROUP,
              cols: 9,
              elements: [
                {
                  id: 'title',
                  type: Elements.INPUT,
                  title: 'Title',
                  value: '',
                },
                {
                  id: 'description',
                  type: Elements.INPUT,
                  title: 'Description',
                  rows: 5,
                },
              ],
            },
            {
              type: Elements.GROUP,
              cols: 3,
              elements: [
                {
                  id: 'taskNumber',
                  type: Elements.INPUT,
                  title: 'Task number',
                  format: val => Number(val.replace(/\D/g, '')),
                },
                {
                  id: 'project',
                  type: Elements.SELECT,
                  title: 'Project',
                  getOptions: this.getProjects,
                },
              ],
            },
          ],
        },
        ...this.bp.elements,
      ],
    });
    if (params.id && params.id !== 'new') {
      this._id = params.id;
      this.load();
    }
  }

  getProjects = async () => {
    const result = await Form.request(`${this.app.baseUrl}/_design/Project/_view/list`);
    return result.response.rows.map(row => row.value);
  }
  save = async () => {
    const data = {
      entity: 'Task',
      ...this.getValues(),
    };
    if (!data.taskNumber && data.project) {
      const { response: project } = await Form.request(`${this.app.baseUrl}/${data.project._id}`);
      project.taskNumber += 1;
      await await Form.request(
        `${this.app.baseUrl}/${data.project._id}`,
        { method: 'PUT', body: JSON.stringify(project) },
      );
      data.taskNumber = project.taskNumber;
      this.content.taskNumber.value = data.taskNumber;
    }
    const result = await Form.request(`${this.app.baseUrl}/${this._id ? this._id : ''}`, {
      method: this._id ? 'PUT' : 'POST',
      body: JSON.stringify({
        _id: this._id,
        _rev: this._rev,
        ...data,
      }),
    });
    if (result.response) {
      this._id = result.response.id;
      this._rev = result.response.rev;
    }
  }
  load = async () => {
    const result = await Form.request(`${this.app.baseUrl}/${this._id}`);
    if (result.response) {
      const data = result.response;
      this._id = data._id;
      this._rev = data._rev;
      this.setValues(data);
      this.bp.update(getIn(data, 'project.bp._id'));
    }
  }
}
