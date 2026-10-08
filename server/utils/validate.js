import mongoose from "mongoose";

export const isValidObjectId = (id) => {
    return mongoose.isValidObjectId(id);
};

export const parseDate = (value) => {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
};
