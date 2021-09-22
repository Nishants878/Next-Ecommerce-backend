import { createAuth } from '@keystone-next/auth';
import { config, createSchema } from '@keystone-next/keystone/schema';
import {
  withItemData,
  statelessSessions,
} from '@keystone-next/keystone/session';
import { extendGraphqlSchema } from './mutations/index';
import { CartItem } from './schemas/CartItem';
import { ProductImage } from './schemas/ProductImage';
import { Product } from './schemas/Product';
import { User } from './schemas/Users';
import 'dotenv/config';
import { insertSeedData } from './seed-data';
import { sendPasswordResetEmail } from './lib/mail';
import { OrderItem } from './schemas/OrderItem';
import { Order } from './schemas/Order';

const databaseURL =
  process.env.DATABASE_URL || 'mongodb://localhost/keystone-sick-fits-tutorial';

const sessionConfig = {
  maxAge: 60 * 60 * 24 * 360, // How long they stay signed in?
  secret: process.env.COOKIE_SECRET,
};
const { withAuth } = createAuth({
  listKey: 'User',
  identityField: 'email',
  secretField: 'password',
  initFirstItem: {
    fields: ['name', 'email', 'password'],
    // Todo: Add in intial roles
  },
  passwordResetLink: {
    async sendToken(args) {
      // send the email

      await sendPasswordResetEmail(args.token, args.identity);
    },
  },
});
export default withAuth(
  config({
    server: {
      cors: {
        origin: [process.env.FRONTEND_URL],
        credentials: true,
      },
    },
    db: {
      adapter: 'mongoose',
      url: databaseURL,
      async onConnect(keystone) {
        if (process.argv.includes('--seed-data')) {
          await insertSeedData(keystone);
        }
      },
    },
    lists: createSchema({
      // Schema items go in here
      User,
      Product,
      ProductImage,
      CartItem,
      OrderItem,
      Order,
    }),
    extendGraphqlSchema,
    ui: {
      // Tshow ui only for people who pass this test
      isAccessAllowed: ({ session }) =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        !!session?.data,
    },
    session: withItemData(statelessSessions(sessionConfig), {
      // GraphQl Query
      User: 'id',
    }),
  })
);
