import { Schema } from 'dynamoose';

export const MessageSchema = new Schema(
  {
    room: {
      type: String,
      hashKey: true,
    },
    msid: {
      type: String,
      rangeKey: true,
    },
    user: {
      type: Object,
      schema: {
        id: String,
        username: String,
        avatar: String,
      },
    },
    text: String,
    type: String,
  },
  {
    timestamps: {
      createdAt: {
        createdAt: {
          type: {
            value: Date,
            settings: {
              storage: 'iso',
            },
          },
        },
      },
      updatedAt: null,
    },
  },
);

console.log('hashKey:', MessageSchema.hashKey);