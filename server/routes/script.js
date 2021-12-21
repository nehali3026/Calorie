const TresholdID = require('../models/tresholdId');
const Food = require('../models/food');
const User = require('../models/user');

TresholdID.remove({}).then((resp) => {}).catch((error) => {console.log(error);});