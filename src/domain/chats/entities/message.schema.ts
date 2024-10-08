import { Schema } from 'dynamoose';
import { MessageType } from 'src/common/enums';

export const MessageSchema = new Schema(
  {
    meetupId: {
      type: Number,
      hashKey: true,
      required: true,
    },
    id: {
      type: String, // in the form of `msg_{unixtimestamp}_{userid}`
      rangeKey: true,
      required: true,
    },
    userId: {
      type: Number,
    },
    messageType: {
      type: String, // MessageType,
      enum: [
        MessageType.AUDIO,
        MessageType.CUSTOM,
        MessageType.FILE,
        MessageType.IMAGE,
        MessageType.SYSTEM,
        MessageType.TEXT,
        MessageType.UNSUPPORTED,
        MessageType.VIDEO,
      ],
    },
    message: {
      type: String,
      required: false,
    },
    image: {
      type: Object,
      schema: {
        uri: String,
        size: Number,
        width: Number,
        height: Number,
      },
      required: false,
    },
    appointment: {
      type: Object,
      schema: {
        dateTime: {
          type: {
            value: Date,
            settings: {
              storage: 'iso',
            },
          },
        },
        title: String,
        image: String,
        venueName: String,
        venueAddress: String,
        venueImage: String,
      },
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

// console.log('hashKey:', MessageSchema.hashKey);
