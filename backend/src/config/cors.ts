// import { CorsOptions } from 'cors';

// const allowedOrigins = process.env.CLIENT_URL
//   ? process.env.CLIENT_URL.split(',')
//   : ['http://localhost:3000', 'http://localhost:3001'];

// export const corsOptions: CorsOptions = {
//   origin: (origin, callback) => {
//     // Allow requests with no origin (like mobile apps or curl requests)
//     if (!origin) return callback(null, true);

//     // Use environment variable for allowed origins
//     const allowedOrigins = process.env.FRONTEND_URL
//       ? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
//       : [ 
//           'https://dezolver-seven.vercel.app',
//           'http://localhost:5173',
//           'http://localhost:5174',
//           'http://localhost:3000',
//           'http://localhost:3001',
//           'http://localhost:3002',
//           'http://127.0.0.1:5173'
//         ];

//     if (allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS policy'));
//     }
//   },
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//   allowedHeaders: [
//     'Content-Type',
//     'Authorization',
//     'X-Requested-With',
//     'Accept',
//     'Origin',
//     'Access-Control-Request-Method',
//     'Access-Control-Request-Headers',
//     'X-CSRF-Token'
//   ],
//   exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
//   maxAge: 86400 // 24 hours
// };

import { CorsOptions } from 'cors';

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Use environment variable for allowed origins
    const allowedOrigins = process.env.CLIENT_URL
      ? process.env.CLIENT_URL.split(',').map((url) => url.trim())
      : [ 
          'https://dezolver-seven.vercel.app',
          'http://localhost:5173',
          'http://localhost:5174',
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:3002',
          'http://127.0.0.1:5173'
        ];

    console.log('Request origin:', origin);
    console.log('Allowed origins:', allowedOrigins);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'X-CSRF-Token'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
  maxAge: 86400 // 24 hours
};