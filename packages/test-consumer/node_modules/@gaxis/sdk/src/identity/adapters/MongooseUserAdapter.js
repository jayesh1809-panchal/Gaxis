const BaseUserAdapter = require('./BaseUserAdapter');

/**
 * Mongoose (MongoDB) User Adapter
 */
class MongooseUserAdapter extends BaseUserAdapter {
    constructor(mongooseUserModel) {
        super();
        this.UserModel = mongooseUserModel;
    }

    async findByGAxisId(gaxisUserId) {
        return this.UserModel.findOne({ gaxisUserId });
    }

    async findByEmail(email) {
        return this.UserModel.findOne({ email });
    }

    async create(mappedData) {
        const user = new this.UserModel(mappedData);
        return user.save();
    }

    async update(localUserId, mappedData) {
        return this.UserModel.findByIdAndUpdate(localUserId, mappedData, { new: true });
    }

    async link(localUserId, gaxisUserId) {
        return this.UserModel.findByIdAndUpdate(localUserId, { gaxisUserId }, { new: true });
    }

    async unlink(localUserId) {
        return this.UserModel.findByIdAndUpdate(localUserId, { $unset: { gaxisUserId: "" } }, { new: true });
    }
}

module.exports = MongooseUserAdapter;
