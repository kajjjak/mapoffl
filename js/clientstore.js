// use library wrappers instead 
//  - http://jensarps.de/2011/11/25/working-with-idbwrapper-part-1/
//  - http://git.yathit.com/ydn-db/wiki/Home
// http://dev-test.nemikor.com/web-storage/support-test/

// http://caniuse.com/#feat=indexeddb

function ClientStoreInterfaceIndexedDB (){
    //https://developer.mozilla.org/en-US/docs/IndexedDB/Using_IndexedDB
    this.init = function (size_in_mb, dbname, tables, callback_success, callback_failure){
        window.___local_storage_db = undefined;
        var self = this;
        request = indexedDB.open(dbname);
        request.onsuccess = function(e){
            window.___local_storage_db = e.target.result;
            if(callback_success){callback_success();}
        };
        request.onupgradeneeded = function(event) {
            window.___local_storage_db = event.target.result;
            var object_store;
            for (var i in tables){
              object_store = window.___local_storage_db.createObjectStore(tables[i], {keyPath: "key"});
              object_store.createIndex("value", "value", {unique: false});
            }
            if(callback_success){callback_success();}
        };
        request.onerror = function(e){
            console.info("ClientStoreInterfaceIndexedDB error " + e.target.errorCode);
        };
        if(window.webkitStorageInfo){
          window.webkitStorageInfo.requestQuota(
            PERSISTENT, 
            size_in_mb * 1024 * 1024, 
            callback_success,
            callback_failure
          );
        };
    },
    this.__restoreSession = function(callback_success){

    },
    this.setSize = function(size_in_mb, callback_success, callback_failure){
        // Request Quota (only for File System API)  
        if(window.webkitStorageInfo){
            window.webkitStorageInfo.requestQuota(webkitStorageInfo.PERSISTENT, size_in_mb*1024*1024, function(grantedBytes) {
              window.webkitRequestFileSystem(webkitStorageInfo.PERSISTENT, grantedBytes, function(){if(callback_success){callback_success();}}, function(e){if(callback_failure){callback_failure(e);}});
            }, function(e) {
              if(callback_failure){callback_failure(e);}
            });
        }
    },
    this.getSize = function(callback_success, callback_failure){
        // Request storage usage and capacity left
        if(window.webkitStorageInfo){
          window.webkitStorageInfo.queryUsageAndQuota(
            window.webkitStorageInfo.PERSISTENT, //the type can be either TEMPORARY or PERSISTENT
            callback_success, 
            callback_failure);
        }else{
          callback_failure(-1);
        }
    },
    this.getObjectStore = function(store_name, mode) {
        if (window.___local_storage_db === undefined){ throw("ClientStoreInterfaceIndexedDB: must be called with init before use."); }
        var tx = window.___local_storage_db.transaction(store_name, mode);
        return tx.objectStore(store_name);
    },
    this.clear = function (d, callback_success, callback_failure){
        var store = this.getObjectStore(d, 'readwrite');
        var req = store.clear();
        sessionStorage.clear();
        req.onsuccess = function(evt) {
          console.info("ClientStoreInterfaceIndexedDB: Store cleared");
          if(callback_success){callback_success();}
        };
        req.onerror = function (evt) {
          console.error("ClientStoreInterfaceIndexedDB: Clear failed ", evt.target.errorCode);
          if(callback_failure){callback_failure();}
        };
    },
    this.setItem = function (d, n, v){
        var object_store = this.getObjectStore(d, "readwrite");
        object_store.add({"key":n, "value": v});
    },
    this.getItem = function (d, n, callback_success, callback_failure){
      var object_store = this.getObjectStore(d, "readwrite");
      var request = object_store.get(n);
      request.onerror = function(event) {
        callback_failure();
      };
      request.onsuccess = function(event) {
        if (request.result){callback_success(request.result.value);}
        else {callback_failure(undefined);}
      };        
    },
    this.getAll = function(d, callback_success, callback_failure){
      var items = [];
      var object_store = this.getObjectStore(d, 'readwrite');
      object_store.openCursor().onsuccess = function(event) {
        var cursor = event.target.result;
        if (cursor) {
          items.push(cursor.value);
          cursor.continue();
        }
        else {
          callback_success(items);
        }
      };      
    },
    this.removeItem = function(d, k){
        var request = this.getObjectStore(d, 'readwrite').delete(k);
        request.onerror = function(event) {
          console.info("ClientStoreInterfaceIndexedDB: error removing item " + k);
        };
        request.onsuccess = function(event) {
          console.info("ClientStoreInterfaceIndexedDB: removed item " + k);
        };
    };
}


function ClientStoreInterfaceWebSQL (){
    this.init = function (size_in_mb, dbname, callback_success, callback_failure){
        this.___local_storage_db = openDatabase(dbname, '1.0', dbname, size_in_mb * 1024 * 1024);
        this.___local_storage_db.transaction(function(tx) {
          tx.executeSql('CREATE TABLE IF NOT EXISTS buffer (id unique, text)', function(){
            if(callback_success){callback_success();}
          });
        });
    },
    this.clear = function (callback_success){
        var sql = 'DELETE FROM buffer';
        this.___local_storage_db.transaction(function(tx){
            tx.executeSql(sql);
            if(callback_success){
                callback_success();
            }
        });
    },
    this.setSize = function(){
      /*not supported in websql*/
    },
    this.getSize = function(callback_success, callback_failure){
      callback_failure(-1);
    },
    this.setItem = function (k, v){
        this.___local_storage_db.transaction(function(tx) {tx.executeSql('INSERT INTO buffer (id, text) VALUES (?, ?)', [k, v]);});
    },
    this.getItem = function (k, default_value, callback_success, callback_failure){
        var key = k;
        var v = default_value;
        this.___local_storage_db.transaction(function(tx) {
            var value = v;
            tx.executeSql('SELECT * FROM buffer WHERE id=?', [key], function(tx, results) {
                var len = results.rows.length, i;
                var v = value;
                for (i = 0; i < len; i++) {
                    v = results.rows.item(i).text;
                }
                if(callback_success){
                    callback_success(v);
                }
            });
        });
    },
    this.removeItem = function(d, k){
        this.clear();
    };
}

/*// Request storage usage and capacity left
window.webkitStorageInfo.queryUsageAndQuota(webkitStorageInfo.TEMPORARY, //the type can be either TEMPORARY or PERSISTENT
function(used, remaining) {
  console.log("Used quota: " + used + ", remaining quota: " + remaining);
}, function(e) {
  console.log('Error', e); 
} );*/

var ClientStore = new function() {

    this.USE_DB_INDEXEDDB = 1;
    this.USE_DB_WEBSQLDB = 2;
    this.init = function(size_in_mb, db_name, tables, callback_success, callback_failure, use_db){
        var self = this;        
        var use_db_indexeddb = Modernizr.indexeddb;
        var use_db_websqldatabase = Modernizr.websqldatabase;
        /*
        if(use_db){
          use_db_indexeddb = (use_db == this.USE_DB_INDEXEDDB);
          use_db_websqldatabase = (use_db == this.USE_DB_WEBSQLDB);
        }
        */
        if (use_db_indexeddb){
          this.db = new ClientStoreInterfaceIndexedDB();
        }else{
          if(use_db_websqldatabase){
            this.db = new ClientStoreInterfaceWebSQL();
          }else{
            if(callback_failure){callback_failure("store could not find extended storage");}
          }
        }
        this.db.init(size_in_mb, db_name, tables, callback_success, callback_failure);
    };

    this.setSize = function(size_in_megabites, callback_success, callback_failure){
      this.db.setSize(size_in_megabites, callback_success, callback_failure);
    };
    
    this.getSize = function(callback_success, callback_failure){
      this.db.getSize(callback_success, callback_failure);
    };
    
    this.setItem = function(d, k, v){
      this.db.setItem(d, k, v);
    };

    this.getItem = function(d, k, callback_success, callback_failure){
      this.db.getItem(d, k, callback_success, callback_failure);
    };

    this.removeItem = function(d, k){
      this.db.removeItem(d, k);
    };

    this.clear = function(except_values){
      this.db.clear();
    };
    
    this.getAll = function(d, callback_success){
      this.db.getAll(d, callback_success);
    };
};

function ClientStoreUtilsRemoveIndexedDB(databaseName){
  var req = indexedDB.deleteDatabase(databaseName);
  req.onsuccess = function () {
      console.log("Deleted database successfully");
  };
  req.onerror = function () {
      console.log("Couldn't delete database");
  }
}