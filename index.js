      import express from 'express';
      import bodyParser from 'body-parser';
      import { fileURLToPath } from 'url';
      import path from 'path';
      import cors from 'cors';
      import crypto from 'crypto';

      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);

      const app = express();
      app.use(express.static('public'));
      app.use(express.static(path.join(__dirname)));

      app.use(function (req, res, next) {
        res.setHeader(
          'Content-Security-Policy',
          "frame-src 'self' https://links.becomecgpro.com https://intercom-sheets.com"
        );
        res.setHeader('X-Requested-With', 'XMLHttpRequest');
        next();
      });

      app.use(cors());
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({ extended: true }));

      const listener = app.listen(3000, () => {
        console.log('Your app is listening on port ' + 3000);
      });

      const initialCanvas = {
        canvas: {
          content: {
            components: [
              {
                type: 'text',
                id: 'book-meeting',
                text: 'CG Pro Admissions Consultation',
                align: 'center',
                style: 'header',
              },
              {
                type: 'button',
                label: 'See dates',
                style: 'primary',
                id: 'submit_button',
                action: {
                  type: 'sheet',
                  url: 'https://3dfe7fc4-b345-48e3-a6ea-118f02f7af0f-00-36aycqxyntol3.pike.replit.dev/sheet',
                },
              },
            ],
          },
        },
      };

      // Serve static files from the "public" directory
      app.use(express.static(path.join(__dirname, 'public')));

      app.get('/', (response) => {
        response.sendFile(path.join(__dirname, 'index.html'));
      });

      // Send the first canvas which will display a button
      app.post('/initialize', (request, response) => {
        response.send(initialCanvas);
      });

      /*
      When this endpoint is called, it will decode and verify the user, then display the sheet in the iFrame.
      */
      app.post('/sheet', (req, res) => {
        // console.log("req", req);
        const jsonParsed = JSON.parse(req.body.intercom_data);

        const encodedUser = jsonParsed.user;

        // console.log(encodedUser);

        let decodedUser = decodeUser(encodedUser);

        console.log(decodedUser);

        res.sendFile(path.join(__dirname, 'sheets.html'));
      });

      /*
      When this endpoint is called from within the sheet, it will:
      - close the sheet
      - gather the user-submitted data
      - display the final canvas you would like to show the user

      You could also take the user data and pass it from here to perform other actions.
      */
      app.post('/submit-sheet', (req, res) => {
        // you can get data about the contact, company, and sheet from the request
        console.log(req.body);

        const chosenDate = new Date(req.body.sheet_values.date);

        // Extract the date part in YYYY-MM-DD format
        const displayDate = chosenDate.toISOString().split('T')[0];

        const finalCanvas = {
          canvas: {
            content: {
              components: [
                {
                  type: 'text',
                  id: 'closing',
                  text: 'Thanks! Your meeting is booked for ' + displayDate,
                  align: 'center',
                  style: 'header',
                },
              ],
            },
          },
        };

        res.send(finalCanvas);
      });

      /*
      This function can be used to decode the user object, which will allow you to verify the identity of the user.
      */
      function decodeUser(encodedUser) {
        const masterkey = 'c0e35f6d-e877-44bd-bb0c-7309b906254e';

        // base64 decoding
        const bData = Buffer.from(encodedUser, 'base64');

        // convert data to buffers
        const ivlen = 12;
        const iv = bData.slice(0, ivlen);

        const taglen = 16;
        const tag = bData.slice(bData.length - taglen, bData.length);

        const cipherLen = bData.length - taglen;
        const cipherText = bData.slice(ivlen, cipherLen);

        let hash = crypto.createHash('sha256').update(masterkey);
        let key = Buffer.from(hash.digest('binary'), 'binary'); //buffer from binary string.

        // AES 256 GCM Mode
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(tag);

        // encrypt the given text
        let decrypted = decipher.update(cipherText, 'binary', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
      }
