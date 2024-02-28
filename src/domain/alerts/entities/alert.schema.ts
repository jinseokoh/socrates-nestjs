import { Schema } from 'dynamoose';
import { AlertType } from 'src/common/enums';

export const AlertSchema = new Schema(
  {
    userId: {
      type: Number,
      hashKey: true,
      required: true,
    },
    id: {
      type: String, // in the form of `msg_{unixtimestamp}`
      rangeKey: true,
      required: true,
    },
    alertType: {
      type: String, // AlertType,
      enum: [
        AlertType.GENERAL,
        AlertType.MEETUP,
        AlertType.CONNECTION,
        AlertType.FRIENDSHIP,
        AlertType.INQUIRY,
      ],
    },
    message: {
      type: String,
    },
    link: {
      type: String,
      required: false,
    },
    user: {
      type: Object,
      schema: {
        username: String,
        avatar: String,
        gender: String,
        userId: Number,
        age: Number,
      },
      required: false,
    },
    expires: {
      type: {
        value: Number,
        settings: {
          storage: 'seconds', //! this must be 10 digit number
        },
      },
    },
  },
  {
    timestamps: {
      createdAt: {
        createdAt: {
          type: {
            value: Number,
            settings: {
              storage: 'milliseconds',
            },
          },
        },
      },
      updatedAt: {
        updatedAt: {
          type: {
            value: Number,
            settings: {
              storage: 'milliseconds',
            },
          },
        },
      },
    },
  },
);

// console.log('hashKey:', AlertSchema.hashKey);
