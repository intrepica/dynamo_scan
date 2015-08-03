'use strict';

var expect = require('expect.js');
var sinon = require('sinon');
var nock = require('nock');

var mock = sinon.mock;
var stub = sinon.stub;

describe('dynamo_scan', function(){
  var db;

  beforeEach(function() {    
    process.env.DYNAMO_REGION = 'us-east-1';  
    process.env.DYNAMO_TABLE = 'games';  
    db = require('../');
  });

  describe('#scan', function() {
    describe('when the request is good', function() {
      var items, LastEvaluatedKey;      

      beforeEach(function() {
        LastEvaluatedKey = {
          "user_id":{"S":"T53005"}
        };

        items = [
          {"user_id":{"S":"T53020"}},
          {"user_id":{"S":"T53022"}},
          {"user_id":{"S":"A38891"}},
          {"user_id":{"S":"23424234"}},
          {"user_id":{"S":"T53005"}}
        ];

        nock('https://dynamodb.us-east-1.amazonaws.com:443')
          .post('/', {
            "TableName":"games",
            "Limit":5,
            "ProjectionExpression":"user_id"
          })
          .reply(200, {
            "Count":5,
            "Items":items,
            "LastEvaluatedKey":LastEvaluatedKey,
            "ScannedCount":5
          });     
      }); 

      it('queries up to limit rows', function(done) {
        db.scan('user_id', 5, null, function(err, rows, LastEvaluatedKey) {
          expect(rows).to.eql(items);
          done();
        });
      });

      it('returns the LastEvaluatedKey', function(done) {
        db.scan('user_id', 5, null, function(err, rows, lastKey) {
          expect(LastEvaluatedKey).to.eql(lastKey);
          done();
        });
      });  
    });

    describe('when the request fails', function() {
      beforeEach(function() {
        nock('https://dynamodb.us-east-1.amazonaws.com:443')        
          .post('/')
          .reply(400, {
            "message":"Request failed"
          });     
      }); 

      it('calls back with the error', function(done) {
        db.scan('user_id', 5, null, function(err) {
          expect(err.message).to.eql('Request failed');
          done();
        });
      });
    });
  });


  describe('#scanAll', function() {
    describe('when the request is good', function() {
      var items1, items2;

      beforeEach(function() {
        function lastKey(key) {
          return {"user_id":{"S":key}};
        }

        items1 = [
          {"user_id":{"S":"1"}},
          {"user_id":{"S":"2"}},
          {"user_id":{"S":"3"}},
          {"user_id":{"S":"4"}},
          {"user_id":{"S":"5"}}
        ];

        nock('https://dynamodb.us-east-1.amazonaws.com:443')
          .post('/', {
            "TableName":"games",
            "Limit":5,
            "ProjectionExpression":"user_id"
          })
          .reply(200, {
            "Items":items1,
            "LastEvaluatedKey":lastKey('5')
          });  

        items2 = [
          {"user_id":{"S":"6"}},
          {"user_id":{"S":"7"}}
        ];

        nock('https://dynamodb.us-east-1.amazonaws.com:443')
          .post('/', {
            "TableName":"games",
            "Limit":5,
            "ProjectionExpression":"user_id",
            "ExclusiveStartKey":lastKey('5')
          })
          .reply(200, {
            "Items":items2,
            "LastEvaluatedKey": null
          });  

      }); 

      it('calls the iterator callback 7 times', function(done) {
        var iterator = mock();
        iterator.exactly(7).yields(null);
        db.scanAll('user_id', 5, iterator, function() {
          iterator.verify();
          done();
        });
      });

      it('calls the iterator with each item', function(done) {
        var items = items1.concat(items2);        
        db.scanAll('user_id', 5, function(item, cb) {
          expect(items.shift()).to.eql(item);
          cb();
        }, done);
      });      

      describe('when the iterator calls back with an error', function() {
        it('calls the done handler with the error', function(done) {             
          db.scanAll('user_id', 5, function(item, cb) {            
            cb(new Error('Boom!'));
          }, function(err) {
            expect(err.message).to.eql('Boom!');
            done();
          });
        }); 
      });
    });

    describe('when the request is fails', function() {
      beforeEach(function() {
        nock('https://dynamodb.us-east-1.amazonaws.com:443')        
          .post('/')
          .reply(400, {
            "message":"Request failed"
          });     
      }); 

      it('calls back with the error', function(done) {        
        var iterator = mock();
        iterator.never();
        db.scanAll('user_id', 5, iterator, function(err) {
          expect(err.message).to.eql('Request failed');
          iterator.verify();
          done();
        });
      });    

    });
  });

});
