const BaseUserAdapter = require('./BaseUserAdapter');

/**
 * Sequelize (SQL) User Adapter
 */
class SequelizeUserAdapter extends BaseUserAdapter {
    constructor(sequelizeUserModel) {
        super();
        this.UserModel = sequelizeUserModel;
    }

    async findByGAxisId(gaxisUserId) {
        return this.UserModel.findOne({ where: { gaxisUserId } });
    }

    async findByEmail(email) {
        return this.UserModel.findOne({ where: { email } });
    }

    async create(mappedData) {
        return this.UserModel.create(mappedData);
    }

    async update(localUserId, mappedData) {
        await this.UserModel.update(mappedData, { where: { id: localUserId } });
        return this.UserModel.findByPk(localUserId);
    }

    async link(localUserId, gaxisUserId) {
        await this.UserModel.update({ gaxisUserId }, { where: { id: localUserId } });
        return this.UserModel.findByPk(localUserId);
    }

    async unlink(localUserId) {
        await this.UserModel.update({ gaxisUserId: null }, { where: { id: localUserId } });
        return this.UserModel.findByPk(localUserId);
    }
}

module.exports = SequelizeUserAdapter;
