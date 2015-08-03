
## Dynamo Scan

Calls the aws-sdk's scan at a given throttle and calls an iterator function in parallel (max == throttle).

The following environment variables must be set:
```
DYNAMO_REGION
DYNAMO_TABLE
```

### scan(attributes, limit, ExclusiveStartKey, callback);

Returns `limit` number of rows from dynamo. If ExclusiveStartKey is set, it will start from that row.

```js
    var db = require('dynamo_scan');

    db.scan('user_id', 5, null, function(err, items, LastEvaluatedKey)         
        cb();
    });
```


### scanAll(attributes, throttle, iterator, done);

The `iterator` function will be called in parallel up to `throttle` until all items have been iterated.

```js
    var db = require('dynamo_scan');

    db.scanAll('user_id', 5, function iterator(rows, cb) { 
        cb();
    }, function finished() { 
        console.log('done', arguments) 
    });
```