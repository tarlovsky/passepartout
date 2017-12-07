## Passepartout

### Web Server Stack
```js
    -NodeJS 
    -MongoDB with Mongoose connector
    -ExpressJS
    -crypto (node native package)
    -qr-image (npm package)
```

## Installation
Need to configure a MongoDB database connection which can be done with [mLab](https://mlab.com) or using a local machine database.
Create a new file named `database.js` inside `config/` containig your database endpoint as follows.

```js
    module.exports = {
        'url': 'mongodb://<dbuser>:<dbpassword>@<url>:<port>/<dbname>'
    };
```

Completed the step above then you can run `npm install`  and `node index.js` if testing locally or deploy the repo to [heroku](https://www.heroku.com/).

To test your application you do not need to deploy it to heroku since it's already deployed by us. 
It can be found at [passepart.herokuapp.com](https://passepart.herokuapp.com/)