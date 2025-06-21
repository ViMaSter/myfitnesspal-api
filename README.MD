# MyFitnessPal API JavaScript client

Submit nutrition information to MyFitnessPal.

## Usage

1. In the [the usage reference](https://github.com/ViMaSter/myfitnesspal-api/blob/main/test/auth.test.js#L5-L9), replace `process.env.EMAIL` and `process.env.PASSWORD` with your credentials 

## Running tests

1. Log into your Marley Spoon account and open the developer console in your browser
2. Fetch the `remember_spree_user_token` cookie value
3. Navigate into the `test` subdirectory
4. Create a `.env` file with the following content:  
   ```
   EMAIL="your email"
   PASSWORD="your password"
   ```
5. Run `nvm i && nvm use && npm i`
6. Run `npm run test`
