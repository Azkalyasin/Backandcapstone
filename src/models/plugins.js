// Plugin global: ubah _id -> id dan hapus __v saat dikirim sebagai JSON.
module.exports = function toJSONPlugin(schema) {
  const transform = (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  };
  schema.set('toJSON', { virtuals: false, transform });
  schema.set('toObject', { virtuals: false, transform });
};
