'use strict';

var async = require('async');
var env = process.env;

var AWS = require('aws-sdk');
AWS.config.update({
  region: env.DYNAMO_REGION
});

var dynamodb = new AWS.DynamoDB();

var scan = exports.scan = function(attributes, limit, ExclusiveStartKey, callback) {
  var options = {
      TableName : env.DYNAMO_TABLE,
      Limit : limit,
      ProjectionExpression: attributes
  };

  if (ExclusiveStartKey) {
    options.ExclusiveStartKey = ExclusiveStartKey;
  };

  dynamodb.scan(options, function(err, data) {
      if (err) { 
        return callback(err); 
      }      
      callback(null, data.Items, data.LastEvaluatedKey);
  });
};

var scanAll = exports.scanAll = function scanAll(attributes, throttle, iterator, done) {
  var lastEvaluatedKey = false;
  async.whilst(
    function () { 
      if (lastEvaluatedKey === false) {
        return true;
      }      
      return !!lastEvaluatedKey; 
    },
    function(cb) {
      scan(attributes, throttle, lastEvaluatedKey, function(err, rows, lastKey) {
        if (err) {
          return done(err);
        }
        lastEvaluatedKey = lastKey;
        async.eachLimit(rows, throttle, iterator, cb);
      });      
    },
    done
  );
}

exports.dynamo = dynamodb;
