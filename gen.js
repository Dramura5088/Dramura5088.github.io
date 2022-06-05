(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/**
*   EasyStar.js
*   github.com/prettymuchbryce/EasyStarJS
*   Licensed under the MIT license.
*
*   Implementation By Bryce Neal (@prettymuchbryce)
**/

var EasyStar = {}
var Instance = require('./instance');
var Node = require('./node');
var Heap = require('heap');

const CLOSED_LIST = 0;
const OPEN_LIST = 1;

module.exports = EasyStar;

var nextInstanceId = 1;

EasyStar.js = function() {
    var STRAIGHT_COST = 1.0;
    var DIAGONAL_COST = 1.4;
    var syncEnabled = false;
    var pointsToAvoid = {};
    var collisionGrid;
    var costMap = {};
    var pointsToCost = {};
    var directionalConditions = {};
    var allowCornerCutting = true;
    var iterationsSoFar;
    var instances = {};
    var instanceQueue = [];
    var iterationsPerCalculation = Number.MAX_VALUE;
    var acceptableTiles;
    var diagonalsEnabled = false;

    /**
    * Sets the collision grid that EasyStar uses.
    *
    * @param {Array|Number} tiles An array of numbers that represent
    * which tiles in your grid should be considered
    * acceptable, or "walkable".
    **/
    this.setAcceptableTiles = function(tiles) {
        if (tiles instanceof Array) {
            // Array
            acceptableTiles = tiles;
        } else if (!isNaN(parseFloat(tiles)) && isFinite(tiles)) {
            // Number
            acceptableTiles = [tiles];
        }
    };

    /**
    * Enables sync mode for this EasyStar instance..
    * if you're into that sort of thing.
    **/
    this.enableSync = function() {
        syncEnabled = true;
    };

    /**
    * Disables sync mode for this EasyStar instance.
    **/
    this.disableSync = function() {
        syncEnabled = false;
    };

    /**
     * Enable diagonal pathfinding.
     */
    this.enableDiagonals = function() {
        diagonalsEnabled = true;
    }

    /**
     * Disable diagonal pathfinding.
     */
    this.disableDiagonals = function() {
        diagonalsEnabled = false;
    }

    /**
    * Sets the collision grid that EasyStar uses.
    *
    * @param {Array} grid The collision grid that this EasyStar instance will read from.
    * This should be a 2D Array of Numbers.
    **/
    this.setGrid = function(grid) {
        collisionGrid = grid;

        //Setup cost map
        for (var y = 0; y < collisionGrid.length; y++) {
            for (var x = 0; x < collisionGrid[0].length; x++) {
                if (!costMap[collisionGrid[y][x]]) {
                    costMap[collisionGrid[y][x]] = 1
                }
            }
        }
    };

    /**
    * Sets the tile cost for a particular tile type.
    *
    * @param {Number} The tile type to set the cost for.
    * @param {Number} The multiplicative cost associated with the given tile.
    **/
    this.setTileCost = function(tileType, cost) {
        costMap[tileType] = cost;
    };

    /**
    * Sets the an additional cost for a particular point.
    * Overrides the cost from setTileCost.
    *
    * @param {Number} x The x value of the point to cost.
    * @param {Number} y The y value of the point to cost.
    * @param {Number} The multiplicative cost associated with the given point.
    **/
    this.setAdditionalPointCost = function(x, y, cost) {
        if (pointsToCost[y] === undefined) {
            pointsToCost[y] = {};
        }
        pointsToCost[y][x] = cost;
    };

    /**
    * Remove the additional cost for a particular point.
    *
    * @param {Number} x The x value of the point to stop costing.
    * @param {Number} y The y value of the point to stop costing.
    **/
    this.removeAdditionalPointCost = function(x, y) {
        if (pointsToCost[y] !== undefined) {
            delete pointsToCost[y][x];
        }
    }

    /**
    * Remove all additional point costs.
    **/
    this.removeAllAdditionalPointCosts = function() {
        pointsToCost = {};
    }

    /**
    * Sets a directional condition on a tile
    *
    * @param {Number} x The x value of the point.
    * @param {Number} y The y value of the point.
    * @param {Array.<String>} allowedDirections A list of all the allowed directions that can access
    * the tile.
    **/
    this.setDirectionalCondition = function(x, y, allowedDirections) {
        if (directionalConditions[y] === undefined) {
            directionalConditions[y] = {};
        }
        directionalConditions[y][x] = allowedDirections;
    };

    /**
    * Remove all directional conditions
    **/
    this.removeAllDirectionalConditions = function() {
        directionalConditions = {};
    };

    /**
    * Sets the number of search iterations per calculation.
    * A lower number provides a slower result, but more practical if you
    * have a large tile-map and don't want to block your thread while
    * finding a path.
    *
    * @param {Number} iterations The number of searches to prefrom per calculate() call.
    **/
    this.setIterationsPerCalculation = function(iterations) {
        iterationsPerCalculation = iterations;
    };

    /**
    * Avoid a particular point on the grid,
    * regardless of whether or not it is an acceptable tile.
    *
    * @param {Number} x The x value of the point to avoid.
    * @param {Number} y The y value of the point to avoid.
    **/
    this.avoidAdditionalPoint = function(x, y) {
        if (pointsToAvoid[y] === undefined) {
            pointsToAvoid[y] = {};
        }
        pointsToAvoid[y][x] = 1;
    };

    /**
    * Stop avoiding a particular point on the grid.
    *
    * @param {Number} x The x value of the point to stop avoiding.
    * @param {Number} y The y value of the point to stop avoiding.
    **/
    this.stopAvoidingAdditionalPoint = function(x, y) {
        if (pointsToAvoid[y] !== undefined) {
            delete pointsToAvoid[y][x];
        }
    };

    /**
    * Enables corner cutting in diagonal movement.
    **/
    this.enableCornerCutting = function() {
        allowCornerCutting = true;
    };

    /**
    * Disables corner cutting in diagonal movement.
    **/
    this.disableCornerCutting = function() {
        allowCornerCutting = false;
    };

    /**
    * Stop avoiding all additional points on the grid.
    **/
    this.stopAvoidingAllAdditionalPoints = function() {
        pointsToAvoid = {};
    };

    /**
    * Find a path.
    *
    * @param {Number} startX The X position of the starting point.
    * @param {Number} startY The Y position of the starting point.
    * @param {Number} endX The X position of the ending point.
    * @param {Number} endY The Y position of the ending point.
    * @param {Function} callback A function that is called when your path
    * is found, or no path is found.
    * @return {Number} A numeric, non-zero value which identifies the created instance. This value can be passed to cancelPath to cancel the path calculation.
    *
    **/
    this.findPath = function(startX, startY, endX, endY, callback) {
        // Wraps the callback for sync vs async logic
        var callbackWrapper = function(result) {
            if (syncEnabled) {
                callback(result);
            } else {
                setTimeout(function() {
                    callback(result);
                });
            }
        }

        // No acceptable tiles were set
        if (acceptableTiles === undefined) {
            throw new Error("You can't set a path without first calling setAcceptableTiles() on EasyStar.");
        }
        // No grid was set
        if (collisionGrid === undefined) {
            throw new Error("You can't set a path without first calling setGrid() on EasyStar.");
        }

        // Start or endpoint outside of scope.
        if (startX < 0 || startY < 0 || endX < 0 || endY < 0 ||
        startX > collisionGrid[0].length-1 || startY > collisionGrid.length-1 ||
        endX > collisionGrid[0].length-1 || endY > collisionGrid.length-1) {
            throw new Error("Your start or end point is outside the scope of your grid.");
        }

        // Start and end are the same tile.
        if (startX===endX && startY===endY) {
            callbackWrapper([]);
            return;
        }

        // End point is not an acceptable tile.
        var endTile = collisionGrid[endY][endX];
        var isAcceptable = false;
        for (var i = 0; i < acceptableTiles.length; i++) {
            if (endTile === acceptableTiles[i]) {
                isAcceptable = true;
                break;
            }
        }

        if (isAcceptable === false) {
            callbackWrapper(null);
            return;
        }

        // Create the instance
        var instance = new Instance();
        instance.openList = new Heap(function(nodeA, nodeB) {
            return nodeA.bestGuessDistance() - nodeB.bestGuessDistance();
        });
        instance.isDoneCalculating = false;
        instance.nodeHash = {};
        instance.startX = startX;
        instance.startY = startY;
        instance.endX = endX;
        instance.endY = endY;
        instance.callback = callbackWrapper;

        instance.openList.push(coordinateToNode(instance, instance.startX,
            instance.startY, null, STRAIGHT_COST));

        var instanceId = nextInstanceId ++;
        instances[instanceId] = instance;
        instanceQueue.push(instanceId);
        return instanceId;
    };

    /**
     * Cancel a path calculation.
     *
     * @param {Number} instanceId The instance ID of the path being calculated
     * @return {Boolean} True if an instance was found and cancelled.
     *
     **/
    this.cancelPath = function(instanceId) {
        if (instanceId in instances) {
            delete instances[instanceId];
            // No need to remove it from instanceQueue
            return true;
        }
        return false;
    };

    /**
    * This method steps through the A* Algorithm in an attempt to
    * find your path(s). It will search 4-8 tiles (depending on diagonals) for every calculation.
    * You can change the number of calculations done in a call by using
    * easystar.setIteratonsPerCalculation().
    **/
    this.calculate = function() {
        if (instanceQueue.length === 0 || collisionGrid === undefined || acceptableTiles === undefined) {
            return;
        }
        for (iterationsSoFar = 0; iterationsSoFar < iterationsPerCalculation; iterationsSoFar++) {
            if (instanceQueue.length === 0) {
                return;
            }

            if (syncEnabled) {
                // If this is a sync instance, we want to make sure that it calculates synchronously.
                iterationsSoFar = 0;
            }

            var instanceId = instanceQueue[0];
            var instance = instances[instanceId];
            if (typeof instance == 'undefined') {
                // This instance was cancelled
                instanceQueue.shift();
                continue;
            }

            // Couldn't find a path.
            if (instance.openList.size() === 0) {
                instance.callback(null);
                delete instances[instanceId];
                instanceQueue.shift();
                continue;
            }

            var searchNode = instance.openList.pop();

            // Handles the case where we have found the destination
            if (instance.endX === searchNode.x && instance.endY === searchNode.y) {
                var path = [];
                path.push({x: searchNode.x, y: searchNode.y});
                var parent = searchNode.parent;
                while (parent!=null) {
                    path.push({x: parent.x, y:parent.y});
                    parent = parent.parent;
                }
                path.reverse();
                var ip = path;
                instance.callback(ip);
                delete instances[instanceId];
                instanceQueue.shift();
                continue;
            }

            searchNode.list = CLOSED_LIST;

            if (searchNode.y > 0) {
                checkAdjacentNode(instance, searchNode,
                    0, -1, STRAIGHT_COST * getTileCost(searchNode.x, searchNode.y-1));
            }
            if (searchNode.x < collisionGrid[0].length-1) {
                checkAdjacentNode(instance, searchNode,
                    1, 0, STRAIGHT_COST * getTileCost(searchNode.x+1, searchNode.y));
            }
            if (searchNode.y < collisionGrid.length-1) {
                checkAdjacentNode(instance, searchNode,
                    0, 1, STRAIGHT_COST * getTileCost(searchNode.x, searchNode.y+1));
            }
            if (searchNode.x > 0) {
                checkAdjacentNode(instance, searchNode,
                    -1, 0, STRAIGHT_COST * getTileCost(searchNode.x-1, searchNode.y));
            }
            if (diagonalsEnabled) {
                if (searchNode.x > 0 && searchNode.y > 0) {

                    if (allowCornerCutting ||
                        (isTileWalkable(collisionGrid, acceptableTiles, searchNode.x, searchNode.y-1, searchNode) &&
                        isTileWalkable(collisionGrid, acceptableTiles, searchNode.x-1, searchNode.y, searchNode))) {

                        checkAdjacentNode(instance, searchNode,
                            -1, -1, DIAGONAL_COST * getTileCost(searchNode.x-1, searchNode.y-1));
                    }
                }
                if (searchNode.x < collisionGrid[0].length-1 && searchNode.y < collisionGrid.length-1) {

                    if (allowCornerCutting ||
                        (isTileWalkable(collisionGrid, acceptableTiles, searchNode.x, searchNode.y+1, searchNode) &&
                        isTileWalkable(collisionGrid, acceptableTiles, searchNode.x+1, searchNode.y, searchNode))) {

                        checkAdjacentNode(instance, searchNode,
                            1, 1, DIAGONAL_COST * getTileCost(searchNode.x+1, searchNode.y+1));
                    }
                }
                if (searchNode.x < collisionGrid[0].length-1 && searchNode.y > 0) {

                    if (allowCornerCutting ||
                        (isTileWalkable(collisionGrid, acceptableTiles, searchNode.x, searchNode.y-1, searchNode) &&
                        isTileWalkable(collisionGrid, acceptableTiles, searchNode.x+1, searchNode.y, searchNode))) {

                        checkAdjacentNode(instance, searchNode,
                            1, -1, DIAGONAL_COST * getTileCost(searchNode.x+1, searchNode.y-1));
                    }
                }
                if (searchNode.x > 0 && searchNode.y < collisionGrid.length-1) {

                    if (allowCornerCutting ||
                        (isTileWalkable(collisionGrid, acceptableTiles, searchNode.x, searchNode.y+1, searchNode) &&
                        isTileWalkable(collisionGrid, acceptableTiles, searchNode.x-1, searchNode.y, searchNode))) {

                        checkAdjacentNode(instance, searchNode,
                            -1, 1, DIAGONAL_COST * getTileCost(searchNode.x-1, searchNode.y+1));
                    }
                }
            }

        }
    };

    // Private methods follow
    var checkAdjacentNode = function(instance, searchNode, x, y, cost) {
        var adjacentCoordinateX = searchNode.x+x;
        var adjacentCoordinateY = searchNode.y+y;

        if ((pointsToAvoid[adjacentCoordinateY] === undefined ||
             pointsToAvoid[adjacentCoordinateY][adjacentCoordinateX] === undefined) &&
            isTileWalkable(collisionGrid, acceptableTiles, adjacentCoordinateX, adjacentCoordinateY, searchNode)) {
            var node = coordinateToNode(instance, adjacentCoordinateX,
                adjacentCoordinateY, searchNode, cost);

            if (node.list === undefined) {
                node.list = OPEN_LIST;
                instance.openList.push(node);
            } else if (searchNode.costSoFar + cost < node.costSoFar) {
                node.costSoFar = searchNode.costSoFar + cost;
                node.parent = searchNode;
                instance.openList.updateItem(node);
            }
        }
    };

    // Helpers
    var isTileWalkable = function(collisionGrid, acceptableTiles, x, y, sourceNode) {
        var directionalCondition = directionalConditions[y] && directionalConditions[y][x];
        if (directionalCondition) {
            var direction = calculateDirection(sourceNode.x - x, sourceNode.y - y)
            var directionIncluded = function () {
                for (var i = 0; i < directionalCondition.length; i++) {
                    if (directionalCondition[i] === direction) return true
                }
                return false
            }
            if (!directionIncluded()) return false
        }
        for (var i = 0; i < acceptableTiles.length; i++) {
            if (collisionGrid[y][x] === acceptableTiles[i]) {
                return true;
            }
        }

        return false;
    };

    /**
     * -1, -1 | 0, -1  | 1, -1
     * -1,  0 | SOURCE | 1,  0
     * -1,  1 | 0,  1  | 1,  1
     */
    var calculateDirection = function (diffX, diffY) {
        if (diffX === 0 && diffY === -1) return EasyStar.TOP
        else if (diffX === 1 && diffY === -1) return EasyStar.TOP_RIGHT
        else if (diffX === 1 && diffY === 0) return EasyStar.RIGHT
        else if (diffX === 1 && diffY === 1) return EasyStar.BOTTOM_RIGHT
        else if (diffX === 0 && diffY === 1) return EasyStar.BOTTOM
        else if (diffX === -1 && diffY === 1) return EasyStar.BOTTOM_LEFT
        else if (diffX === -1 && diffY === 0) return EasyStar.LEFT
        else if (diffX === -1 && diffY === -1) return EasyStar.TOP_LEFT
        throw new Error('These differences are not valid: ' + diffX + ', ' + diffY)
    };

    var getTileCost = function(x, y) {
        return (pointsToCost[y] && pointsToCost[y][x]) || costMap[collisionGrid[y][x]]
    };

    var coordinateToNode = function(instance, x, y, parent, cost) {
        if (instance.nodeHash[y] !== undefined) {
            if (instance.nodeHash[y][x] !== undefined) {
                return instance.nodeHash[y][x];
            }
        } else {
            instance.nodeHash[y] = {};
        }
        var simpleDistanceToTarget = getDistance(x, y, instance.endX, instance.endY);
        if (parent!==null) {
            var costSoFar = parent.costSoFar + cost;
        } else {
            costSoFar = 0;
        }
        var node = new Node(parent,x,y,costSoFar,simpleDistanceToTarget);
        instance.nodeHash[y][x] = node;
        return node;
    };

    var getDistance = function(x1,y1,x2,y2) {
        if (diagonalsEnabled) {
            // Octile distance
            var dx = Math.abs(x1 - x2);
            var dy = Math.abs(y1 - y2);
            if (dx < dy) {
                return DIAGONAL_COST * dx + dy;
            } else {
                return DIAGONAL_COST * dy + dx;
            }
        } else {
            // Manhattan distance
            var dx = Math.abs(x1 - x2);
            var dy = Math.abs(y1 - y2);
            return (dx + dy);
        }
    };
}

EasyStar.TOP = 'TOP'
EasyStar.TOP_RIGHT = 'TOP_RIGHT'
EasyStar.RIGHT = 'RIGHT'
EasyStar.BOTTOM_RIGHT = 'BOTTOM_RIGHT'
EasyStar.BOTTOM = 'BOTTOM'
EasyStar.BOTTOM_LEFT = 'BOTTOM_LEFT'
EasyStar.LEFT = 'LEFT'
EasyStar.TOP_LEFT = 'TOP_LEFT'

},{"./instance":2,"./node":3,"heap":4}],2:[function(require,module,exports){
/**
 * Represents a single instance of EasyStar.
 * A path that is in the queue to eventually be found.
 */
module.exports = function() {
    this.pointsToAvoid = {};
    this.startX;
    this.callback;
    this.startY;
    this.endX;
    this.endY;
    this.nodeHash = {};
    this.openList;
};
},{}],3:[function(require,module,exports){
/**
* A simple Node that represents a single tile on the grid.
* @param {Object} parent The parent node.
* @param {Number} x The x position on the grid.
* @param {Number} y The y position on the grid.
* @param {Number} costSoFar How far this node is in moves*cost from the start.
* @param {Number} simpleDistanceToTarget Manhatten distance to the end point.
**/
module.exports = function(parent, x, y, costSoFar, simpleDistanceToTarget) {
    this.parent = parent;
    this.x = x;
    this.y = y;
    this.costSoFar = costSoFar;
    this.simpleDistanceToTarget = simpleDistanceToTarget;

    /**
    * @return {Number} Best guess distance of a cost using this node.
    **/
    this.bestGuessDistance = function() {
        return this.costSoFar + this.simpleDistanceToTarget;
    }
};
},{}],4:[function(require,module,exports){
module.exports = require('./lib/heap');

},{"./lib/heap":5}],5:[function(require,module,exports){
// Generated by CoffeeScript 1.8.0
(function() {
  var Heap, defaultCmp, floor, heapify, heappop, heappush, heappushpop, heapreplace, insort, min, nlargest, nsmallest, updateItem, _siftdown, _siftup;

  floor = Math.floor, min = Math.min;


  /*
  Default comparison function to be used
   */

  defaultCmp = function(x, y) {
    if (x < y) {
      return -1;
    }
    if (x > y) {
      return 1;
    }
    return 0;
  };


  /*
  Insert item x in list a, and keep it sorted assuming a is sorted.
  
  If x is already in a, insert it to the right of the rightmost x.
  
  Optional args lo (default 0) and hi (default a.length) bound the slice
  of a to be searched.
   */

  insort = function(a, x, lo, hi, cmp) {
    var mid;
    if (lo == null) {
      lo = 0;
    }
    if (cmp == null) {
      cmp = defaultCmp;
    }
    if (lo < 0) {
      throw new Error('lo must be non-negative');
    }
    if (hi == null) {
      hi = a.length;
    }
    while (lo < hi) {
      mid = floor((lo + hi) / 2);
      if (cmp(x, a[mid]) < 0) {
        hi = mid;
      } else {
        lo = mid + 1;
      }
    }
    return ([].splice.apply(a, [lo, lo - lo].concat(x)), x);
  };


  /*
  Push item onto heap, maintaining the heap invariant.
   */

  heappush = function(array, item, cmp) {
    if (cmp == null) {
      cmp = defaultCmp;
    }
    array.push(item);
    return _siftdown(array, 0, array.length - 1, cmp);
  };


  /*
  Pop the smallest item off the heap, maintaining the heap invariant.
   */

  heappop = function(array, cmp) {
    var lastelt, returnitem;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    lastelt = array.pop();
    if (array.length) {
      returnitem = array[0];
      array[0] = lastelt;
      _siftup(array, 0, cmp);
    } else {
      returnitem = lastelt;
    }
    return returnitem;
  };


  /*
  Pop and return the current smallest value, and add the new item.
  
  This is more efficient than heappop() followed by heappush(), and can be
  more appropriate when using a fixed size heap. Note that the value
  returned may be larger than item! That constrains reasonable use of
  this routine unless written as part of a conditional replacement:
      if item > array[0]
        item = heapreplace(array, item)
   */

  heapreplace = function(array, item, cmp) {
    var returnitem;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    returnitem = array[0];
    array[0] = item;
    _siftup(array, 0, cmp);
    return returnitem;
  };


  /*
  Fast version of a heappush followed by a heappop.
   */

  heappushpop = function(array, item, cmp) {
    var _ref;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    if (array.length && cmp(array[0], item) < 0) {
      _ref = [array[0], item], item = _ref[0], array[0] = _ref[1];
      _siftup(array, 0, cmp);
    }
    return item;
  };


  /*
  Transform list into a heap, in-place, in O(array.length) time.
   */

  heapify = function(array, cmp) {
    var i, _i, _j, _len, _ref, _ref1, _results, _results1;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    _ref1 = (function() {
      _results1 = [];
      for (var _j = 0, _ref = floor(array.length / 2); 0 <= _ref ? _j < _ref : _j > _ref; 0 <= _ref ? _j++ : _j--){ _results1.push(_j); }
      return _results1;
    }).apply(this).reverse();
    _results = [];
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      i = _ref1[_i];
      _results.push(_siftup(array, i, cmp));
    }
    return _results;
  };


  /*
  Update the position of the given item in the heap.
  This function should be called every time the item is being modified.
   */

  updateItem = function(array, item, cmp) {
    var pos;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    pos = array.indexOf(item);
    if (pos === -1) {
      return;
    }
    _siftdown(array, 0, pos, cmp);
    return _siftup(array, pos, cmp);
  };


  /*
  Find the n largest elements in a dataset.
   */

  nlargest = function(array, n, cmp) {
    var elem, result, _i, _len, _ref;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    result = array.slice(0, n);
    if (!result.length) {
      return result;
    }
    heapify(result, cmp);
    _ref = array.slice(n);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      elem = _ref[_i];
      heappushpop(result, elem, cmp);
    }
    return result.sort(cmp).reverse();
  };


  /*
  Find the n smallest elements in a dataset.
   */

  nsmallest = function(array, n, cmp) {
    var elem, i, los, result, _i, _j, _len, _ref, _ref1, _results;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    if (n * 10 <= array.length) {
      result = array.slice(0, n).sort(cmp);
      if (!result.length) {
        return result;
      }
      los = result[result.length - 1];
      _ref = array.slice(n);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        elem = _ref[_i];
        if (cmp(elem, los) < 0) {
          insort(result, elem, 0, null, cmp);
          result.pop();
          los = result[result.length - 1];
        }
      }
      return result;
    }
    heapify(array, cmp);
    _results = [];
    for (i = _j = 0, _ref1 = min(n, array.length); 0 <= _ref1 ? _j < _ref1 : _j > _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
      _results.push(heappop(array, cmp));
    }
    return _results;
  };

  _siftdown = function(array, startpos, pos, cmp) {
    var newitem, parent, parentpos;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    newitem = array[pos];
    while (pos > startpos) {
      parentpos = (pos - 1) >> 1;
      parent = array[parentpos];
      if (cmp(newitem, parent) < 0) {
        array[pos] = parent;
        pos = parentpos;
        continue;
      }
      break;
    }
    return array[pos] = newitem;
  };

  _siftup = function(array, pos, cmp) {
    var childpos, endpos, newitem, rightpos, startpos;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    endpos = array.length;
    startpos = pos;
    newitem = array[pos];
    childpos = 2 * pos + 1;
    while (childpos < endpos) {
      rightpos = childpos + 1;
      if (rightpos < endpos && !(cmp(array[childpos], array[rightpos]) < 0)) {
        childpos = rightpos;
      }
      array[pos] = array[childpos];
      pos = childpos;
      childpos = 2 * pos + 1;
    }
    array[pos] = newitem;
    return _siftdown(array, startpos, pos, cmp);
  };

  Heap = (function() {
    Heap.push = heappush;

    Heap.pop = heappop;

    Heap.replace = heapreplace;

    Heap.pushpop = heappushpop;

    Heap.heapify = heapify;

    Heap.updateItem = updateItem;

    Heap.nlargest = nlargest;

    Heap.nsmallest = nsmallest;

    function Heap(cmp) {
      this.cmp = cmp != null ? cmp : defaultCmp;
      this.nodes = [];
    }

    Heap.prototype.push = function(x) {
      return heappush(this.nodes, x, this.cmp);
    };

    Heap.prototype.pop = function() {
      return heappop(this.nodes, this.cmp);
    };

    Heap.prototype.peek = function() {
      return this.nodes[0];
    };

    Heap.prototype.contains = function(x) {
      return this.nodes.indexOf(x) !== -1;
    };

    Heap.prototype.replace = function(x) {
      return heapreplace(this.nodes, x, this.cmp);
    };

    Heap.prototype.pushpop = function(x) {
      return heappushpop(this.nodes, x, this.cmp);
    };

    Heap.prototype.heapify = function() {
      return heapify(this.nodes, this.cmp);
    };

    Heap.prototype.updateItem = function(x) {
      return updateItem(this.nodes, x, this.cmp);
    };

    Heap.prototype.clear = function() {
      return this.nodes = [];
    };

    Heap.prototype.empty = function() {
      return this.nodes.length === 0;
    };

    Heap.prototype.size = function() {
      return this.nodes.length;
    };

    Heap.prototype.clone = function() {
      var heap;
      heap = new Heap();
      heap.nodes = this.nodes.slice(0);
      return heap;
    };

    Heap.prototype.toArray = function() {
      return this.nodes.slice(0);
    };

    Heap.prototype.insert = Heap.prototype.push;

    Heap.prototype.top = Heap.prototype.peek;

    Heap.prototype.front = Heap.prototype.peek;

    Heap.prototype.has = Heap.prototype.contains;

    Heap.prototype.copy = Heap.prototype.clone;

    return Heap;

  })();

  (function(root, factory) {
    if (typeof define === 'function' && define.amd) {
      return define([], factory);
    } else if (typeof exports === 'object') {
      return module.exports = factory();
    } else {
      return root.Heap = factory();
    }
  })(this, function() {
    return Heap;
  });

}).call(this);

},{}],6:[function(require,module,exports){
const Queue = require('./PriorityQueue');

const removeDeepFromMap = require('./removeDeepFromMap');

const toDeepMap = require('./toDeepMap');

const validateDeep = require('./validateDeep');
/** Creates and manages a graph */


class Graph {
  /**
   * Creates a new Graph, optionally initializing it a nodes graph representation.
   *
   * A graph representation is an object that has as keys the name of the point and as values
   * the points reacheable from that node, with the cost to get there:
   *
   *     {
   *       node (Number|String): {
   *         neighbor (Number|String): cost (Number),
   *         ...,
   *       },
   *     }
   *
   * In alternative to an object, you can pass a `Map` of `Map`. This will
   * allow you to specify numbers as keys.
   *
   * @param {Objec|Map} [graph] - Initial graph definition
   * @example
   *
   * const route = new Graph();
   *
   * // Pre-populated graph
   * const route = new Graph({
   *   A: { B: 1 },
   *   B: { A: 1, C: 2, D: 4 },
   * });
   *
   * // Passing a Map
   * const g = new Map()
   *
   * const a = new Map()
   * a.set('B', 1)
   *
   * const b = new Map()
   * b.set('A', 1)
   * b.set('C', 2)
   * b.set('D', 4)
   *
   * g.set('A', a)
   * g.set('B', b)
   *
   * const route = new Graph(g)
   */
  constructor(graph) {
    if (graph instanceof Map) {
      validateDeep(graph);
      this.graph = graph;
    } else if (graph) {
      this.graph = toDeepMap(graph);
    } else {
      this.graph = new Map();
    }
  }
  /**
   * Adds a node to the graph
   *
   * @param {string} name      - Name of the node
   * @param {Object|Map} neighbors - Neighbouring nodes and cost to reach them
   * @return {this}
   * @example
   *
   * const route = new Graph();
   *
   * route.addNode('A', { B: 1 });
   *
   * // It's possible to chain the calls
   * route
   *   .addNode('B', { A: 1 })
   *   .addNode('C', { A: 3 });
   *
   * // The neighbors can be expressed in a Map
   * const d = new Map()
   * d.set('A', 2)
   * d.set('B', 8)
   *
   * route.addNode('D', d)
   */


  addNode(name, neighbors) {
    let nodes;

    if (neighbors instanceof Map) {
      validateDeep(neighbors);
      nodes = neighbors;
    } else {
      nodes = toDeepMap(neighbors);
    }

    this.graph.set(name, nodes);
    return this;
  }
  /**
   * @deprecated since version 2.0, use `Graph#addNode` instead
   */


  addVertex(name, neighbors) {
    return this.addNode(name, neighbors);
  }
  /**
   * Removes a node and all of its references from the graph
   *
   * @param {string|number} key - Key of the node to remove from the graph
   * @return {this}
   * @example
   *
   * const route = new Graph({
   *   A: { B: 1, C: 5 },
   *   B: { A: 3 },
   *   C: { B: 2, A: 2 },
   * });
   *
   * route.removeNode('C');
   * // The graph now is:
   * // { A: { B: 1 }, B: { A: 3 } }
   */


  removeNode(key) {
    this.graph = removeDeepFromMap(this.graph, key);
    return this;
  }
  /**
   * Compute the shortest path between the specified nodes
   *
   * @param {string}  start     - Starting node
   * @param {string}  goal      - Node we want to reach
   * @param {object}  [options] - Options
   *
   * @param {boolean} [options.trim]    - Exclude the origin and destination nodes from the result
   * @param {boolean} [options.reverse] - Return the path in reversed order
   * @param {boolean} [options.cost]    - Also return the cost of the path when set to true
   *
   * @return {array|object} Computed path between the nodes.
   *
   *  When `option.cost` is set to true, the returned value will be an object with shape:
   *    - `path` *(Array)*: Computed path between the nodes
   *    - `cost` *(Number)*: Cost of the path
   *
   * @example
   *
   * const route = new Graph()
   *
   * route.addNode('A', { B: 1 })
   * route.addNode('B', { A: 1, C: 2, D: 4 })
   * route.addNode('C', { B: 2, D: 1 })
   * route.addNode('D', { C: 1, B: 4 })
   *
   * route.path('A', 'D') // => ['A', 'B', 'C', 'D']
   *
   * // trimmed
   * route.path('A', 'D', { trim: true }) // => [B', 'C']
   *
   * // reversed
   * route.path('A', 'D', { reverse: true }) // => ['D', 'C', 'B', 'A']
   *
   * // include the cost
   * route.path('A', 'D', { cost: true })
   * // => {
   * //       path: [ 'A', 'B', 'C', 'D' ],
   * //       cost: 4
   * //    }
   */


  path(start, goal, options = {}) {
    // Don't run when we don't have nodes set
    if (!this.graph.size) {
      if (options.cost) return {
        path: null,
        cost: 0
      };
      return null;
    }

    const explored = new Set();
    const frontier = new Queue();
    const previous = new Map();
    let path = [];
    let totalCost = 0;
    let avoid = [];
    if (options.avoid) avoid = [].concat(options.avoid);

    if (avoid.includes(start)) {
      throw new Error(`Starting node (${start}) cannot be avoided`);
    } else if (avoid.includes(goal)) {
      throw new Error(`Ending node (${goal}) cannot be avoided`);
    } // Add the starting point to the frontier, it will be the first node visited


    frontier.set(start, 0); // Run until we have visited every node in the frontier

    while (!frontier.isEmpty()) {
      // Get the node in the frontier with the lowest cost (`priority`)
      const node = frontier.next(); // When the node with the lowest cost in the frontier in our goal node,
      // we can compute the path and exit the loop

      if (node.key === goal) {
        // Set the total cost to the current value
        totalCost = node.priority;
        let nodeKey = node.key;

        while (previous.has(nodeKey)) {
          path.push(nodeKey);
          nodeKey = previous.get(nodeKey);
        }

        break;
      } // Add the current node to the explored set


      explored.add(node.key); // Loop all the neighboring nodes

      const neighbors = this.graph.get(node.key) || new Map();
      neighbors.forEach((nCost, nNode) => {
        // If we already explored the node, or the node is to be avoided, skip it
        if (explored.has(nNode) || avoid.includes(nNode)) return null; // If the neighboring node is not yet in the frontier, we add it with
        // the correct cost

        if (!frontier.has(nNode)) {
          previous.set(nNode, node.key);
          return frontier.set(nNode, node.priority + nCost);
        }

        const frontierPriority = frontier.get(nNode).priority;
        const nodeCost = node.priority + nCost; // Otherwise we only update the cost of this node in the frontier when
        // it's below what's currently set

        if (nodeCost < frontierPriority) {
          previous.set(nNode, node.key);
          return frontier.set(nNode, nodeCost);
        }

        return null;
      });
    } // Return null when no path can be found


    if (!path.length) {
      if (options.cost) return {
        path: null,
        cost: 0
      };
      return null;
    } // From now on, keep in mind that `path` is populated in reverse order,
    // from destination to origin
    // Remove the first value (the goal node) if we want a trimmed result


    if (options.trim) {
      path.shift();
    } else {
      // Add the origin waypoint at the end of the array
      path = path.concat([start]);
    } // Reverse the path if we don't want it reversed, so the result will be
    // from `start` to `goal`


    if (!options.reverse) {
      path = path.reverse();
    } // Return an object if we also want the cost


    if (options.cost) {
      return {
        path,
        cost: totalCost
      };
    }

    return path;
  }
  /**
   * @deprecated since version 2.0, use `Graph#path` instead
   */


  shortestPath(...args) {
    return this.path(...args);
  }

}

module.exports = Graph;

},{"./PriorityQueue":7,"./removeDeepFromMap":8,"./toDeepMap":9,"./validateDeep":10}],7:[function(require,module,exports){
/**
 * This very basic implementation of a priority queue is used to select the
 * next node of the graph to walk to.
 *
 * The queue is always sorted to have the least expensive node on top.
 * Some helper methods are also implemented.
 *
 * You should **never** modify the queue directly, but only using the methods
 * provided by the class.
 */
class PriorityQueue {
  /**
   * Creates a new empty priority queue
   */
  constructor() {
    // The `keys` set is used to greatly improve the speed at which we can
    // check the presence of a value in the queue
    this.keys = new Set();
    this.queue = [];
  }
  /**
   * Sort the queue to have the least expensive node to visit on top
   *
   * @private
   */


  sort() {
    this.queue.sort((a, b) => a.priority - b.priority);
  }
  /**
   * Sets a priority for a key in the queue.
   * Inserts it in the queue if it does not already exists.
   *
   * @param {any}     key       Key to update or insert
   * @param {number}  value     Priority of the key
   * @return {number} Size of the queue
   */


  set(key, value) {
    const priority = Number(value);
    if (isNaN(priority)) throw new TypeError('"priority" must be a number');

    if (!this.keys.has(key)) {
      // Insert a new entry if the key is not already in the queue
      this.keys.add(key);
      this.queue.push({
        key,
        priority
      });
    } else {
      // Update the priority of an existing key
      this.queue.map(element => {
        if (element.key === key) {
          Object.assign(element, {
            priority
          });
        }

        return element;
      });
    }

    this.sort();
    return this.queue.length;
  }
  /**
   * The next method is used to dequeue a key:
   * It removes the first element from the queue and returns it
   *
   * @return {object} First priority queue entry
   */


  next() {
    const element = this.queue.shift(); // Remove the key from the `_keys` set

    this.keys.delete(element.key);
    return element;
  }
  /**
   * @return {boolean} `true` when the queue is empty
   */


  isEmpty() {
    return Boolean(this.queue.length === 0);
  }
  /**
   * Check if the queue has a key in it
   *
   * @param {any} key   Key to lookup
   * @return {boolean}
   */


  has(key) {
    return this.keys.has(key);
  }
  /**
   * Get the element in the queue with the specified key
   *
   * @param {any} key   Key to lookup
   * @return {object}
   */


  get(key) {
    return this.queue.find(element => element.key === key);
  }

}

module.exports = PriorityQueue;

},{}],8:[function(require,module,exports){
/**
 * Removes a key and all of its references from a map.
 * This function has no side-effects as it returns
 * a brand new map.
 *
 * @param {Map}     map - Map to remove the key from
 * @param {string}  key - Key to remove from the map
 * @return {Map}    New map without the passed key
 */
function removeDeepFromMap(map, key) {
  const newMap = new Map();

  for (const [aKey, val] of map) {
    if (aKey !== key && val instanceof Map) {
      newMap.set(aKey, removeDeepFromMap(val, key));
    } else if (aKey !== key) {
      newMap.set(aKey, val);
    }
  }

  return newMap;
}

module.exports = removeDeepFromMap;

},{}],9:[function(require,module,exports){
/**
 * Validates a cost for a node
 *
 * @private
 * @param {number} val - Cost to validate
 * @return {bool}
 */
function isValidNode(val) {
  const cost = Number(val);

  if (isNaN(cost) || cost <= 0) {
    return false;
  }

  return true;
}
/**
 * Creates a deep `Map` from the passed object.
 *
 * @param  {Object} source - Object to populate the map with
 * @return {Map} New map with the passed object data
 */


function toDeepMap(source) {
  const map = new Map();
  const keys = Object.keys(source);
  keys.forEach(key => {
    const val = source[key];

    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      return map.set(key, toDeepMap(val));
    }

    if (!isValidNode(val)) {
      throw new Error(`Could not add node at key "${key}", make sure it's a valid node`, val);
    }

    return map.set(key, Number(val));
  });
  return map;
}

module.exports = toDeepMap;

},{}],10:[function(require,module,exports){
/**
 * Validate a map to ensure all it's values are either a number or a map
 *
 * @param {Map} map - Map to valiadte
 */
function validateDeep(map) {
  if (!(map instanceof Map)) {
    throw new Error(`Invalid graph: Expected Map instead found ${typeof map}`);
  }

  map.forEach((value, key) => {
    if (typeof value === 'object' && value instanceof Map) {
      validateDeep(value);
      return;
    }

    if (typeof value !== 'number' || value <= 0) {
      throw new Error(`Values must be numbers greater than 0. Found value ${value} at ${key}`);
    }
  });
}

module.exports = validateDeep;

},{}],11:[function(require,module,exports){
var easystarjs = require('easystarjs');
const Graph = require('node-dijkstra');

//Making sure the document is ready first :)
$( document ).ready(function() {
    //adding listener
    document.getElementById("Generate").addEventListener("click", GenerateGrid);
    document.getElementById("Pathfinding").addEventListener("click", GeneratePath);
    document.getElementById("Clearing").addEventListener("click", ClearPath);
});

// variables to track
var xSize, ySize, gridArray, origin, target, path;

// some stuff to use as references :B
const enEmpty = 0, enWall = 1, enOrigin = 2, enTarget = 3, enPath = 4,
emptyCol="white", wallCol="grey", originCol="blue", targetCol="red", hlCol = "green";

// measurments
var timeTaken, costTaken, lenghtTaken;

function GenerateGrid(){

    // Deleting old rows.
    var rowCollection = document.getElementsByClassName('row');
    
    console.log(rowCollection);
    console.log(rowCollection.length);

    if(rowCollection && rowCollection.length) {
        var toBeRemoved = [];
        for (let index = 0; index < rowCollection.length; index++) {
            toBeRemoved.push(rowCollection[index]);
        }

        console.log(toBeRemoved);
        
        for (let index = 0; index < toBeRemoved.length; index++) {
            console.log("removed element: " + toBeRemoved[index]);
            toBeRemoved[index].remove();
        }
    
    }
    
    // Instantiating new rows.
    xSize = Math.abs(document.getElementById('x').value)
    ySize = Math.abs(document.getElementById('y').value)

    gridArray = [];
    for (let y = 0; y < ySize; y++) {
        
        //create new row.
        var newRowElement = document.createElement('div');
        newRowElement.setAttribute('class', 'row'); 
        newRowElement.style.height = (70/ySize) + "vmin";
        document.getElementById('gridHolder').appendChild(newRowElement);

        gridArray.push([]);



        for (let x = 0; x < xSize; x++) {
            //create new tile.
            var newElement = document.createElement('div');
            newElement.setAttribute('class', 'tile'); 
            newElement.id = (y + ',' + x);
            newElement.style.height = (70/ySize) + "vmin";
            newElement.style.backgroundColor = emptyCol;
            newElement.style.width = (70/xSize) + "vmin";
            newElement.style.margin = "0px";
            newElement.onclick = function(){
                TileOnClick(this);
            }
            newRowElement.appendChild(newElement);
            
            if (y == 0 && x == 0) {
                newElement.style.backgroundColor = originCol;
                origin = new Tile(x, y, newElement, enOrigin)
                gridArray[y].push(origin);
                
            }
            else if (y == ySize - 1 && x == xSize - 1){
                newElement.style.backgroundColor = targetCol;
                target = new Tile(x, y, newElement, enTarget)
                gridArray[y].push(target);
            }
            else {
                gridArray[y].push(new Tile(x, y, newElement, enEmpty));
            }
        }
    }
    console.log(gridArray);


}
function TileOnClick (selElement) {
    var select = document.getElementById("placementSelection").value;
    //console.log(selColor);

    var id = selElement.id.split(',');
    var tile = gridArray[id[0]][id[1]];
    //console.log(tile);

    if (select == "empty") {
        selElement.style.backgroundColor = emptyCol;
        tile.type = enEmpty;
    } 
    else if (select == "wall") {
        selElement.style.backgroundColor = wallCol;
        tile.type = enWall;
    }
    else if (select == "target") {
        ClearType(enTarget);
        selElement.style.backgroundColor = targetCol;
        tile.type = enTarget;
        target = tile;
    }
    else if (select == "origin") {
        ClearType(enOrigin);
        selElement.style.backgroundColor = originCol;
        tile.type = enOrigin;
        origin = tile;
    }
}
function GeneratePath(){
    ClearType(enPath);

    
    
    if (document.getElementById("diagonalSel").value == 'true') {
        var diagonalSel = true;
    }
    else {
        var diagonalSel = false;
    }
    var select = document.getElementById("algorithmSelection").value;
    path = [];
    var pOrigin      = [origin.y,origin.x];//[0,0];
    var pTarget      = [target.y,target.x];//[2,2];


    //console.log(pOrigin);
    //console.log(pTarget);


    if (select == 'astar') { // a*
        var startTime   = performance.now();
        var endTime     = 0;
        var graph       =  ConvertToAStarGraph(gridArray);
        var easystar    = new easystarjs.js();

        easystar.setGrid(graph);
        easystar.setAcceptableTiles([1]);
        if (diagonalSel) {
            easystar.enableDiagonals();
        }
        easystar.enableSync();
    
        
        easystar.findPath(pOrigin[1], pOrigin[0], pTarget[1], pTarget[0], function( aStarPath ) {
            if (aStarPath != null) {
                path = aStarPath;
                //console.log("A* Path was not found.");
            } 
            endTime = performance.now();
            timeTaken = endTime - startTime;
            //console.log(startTime);
            //console.log(endTime);
            console.log(timeTaken);
        });
        easystar.calculate();
    }
    else { // dijkstra
        var originKey = (((pOrigin[0]) * gridArray[pOrigin[0]].length) + pOrigin[1]);
        var targetKey = (((pTarget[0]) * gridArray[pTarget[0]].length) + pTarget[1]);

        var startTime   = performance.now();
        var graph = ConvertToDijkstraGraph(gridArray, diagonalSel);
        var diPath = graph.path(originKey, targetKey);

        //console.log("oKey: " + originKey + " | tKey: " + targetKey);
        //console.log("Dijkstra path: ");
        //console.log(diPath);
        

        //make it into a readable format
        for (let i = 0; i < diPath.length; i++) {
            var x = diPath[i], y = 0;
            
                while (x >= xSize) {
                    x = x - xSize
                    y++;
                }
            path.push({'x': x, 'y': y});
        }
        endTime = performance.now();
        timeTaken = endTime - startTime;
        console.log(timeTaken );
    }

    GetCombinedTileCost();
    printMeasuredData();

    console.log(path);
    console.log(costTaken);
    PathHighlinghting();
}
function PathHighlinghting(){
    
    if (path == null) {
        return;
    }

    for (let i = 1; i < path.length -1; i++) {
        var cords = Object.values(path[i]);
        var x = cords[0];
        var y = cords[1];

        gridArray[y][x].element.style.backgroundColor = hlCol;
        gridArray[y][x].type = enPath;
        //console.log(cords);
    }
    //console.log("pathhighlight")
    //console.log(path[0]);

}
function ClearPath(){
    ClearType(enPath);
}
function ClearType( enType) {
    for (let y = 0; y < gridArray.length; y++) {
        for (let x = 0; x < gridArray[y].length; x++) {
            if (gridArray[y][x].type == enType) {
                gridArray[y][x].element.style.backgroundColor = emptyCol;
                gridArray[y][x].type = enEmpty;
            }
        }
    }
}
function ConvertToAStarGraph(jaggedArray){
    var graph = [];

    for (let row = 0; row < jaggedArray.length; row++) {
        var newRow = [];

        for (let tile = 0; tile < jaggedArray[row].length; tile++) {
            if (jaggedArray[row][tile].type == enEmpty) {
                
            }
            if (jaggedArray[row][tile].type == enWall) {
                //  if wall
                newRow.push(0);
            }
            else {
                // if empty / target / origin
                newRow.push(1);
            }
            
        }
        graph.push(newRow);
    }
    //console.log(graph);
    return graph;
}
function ConvertToDijkstraGraph(jaggedArray , canDiagonal, diagonalCost = 1.4, normalCost = 1.0){
    const graph = new Graph();

    nMax = (jaggedArray.length) * (jaggedArray[0].length) - 1;
    n = 0;
    for (let y = 0; y < jaggedArray.length; y++) {
       
        for (let x = 0; x < jaggedArray[y].length; x++) {
            var connections = new Map();
            
            var rowLenght = jaggedArray[y].length
            , iTopLeft    = n - rowLenght - 1
            , iTopMid     = n - rowLenght + 0
            , iTopRight   = n - rowLenght + 1
            , iRight      = n + 1
            , iLeft       = n - 1
            , iBotLeft    = n + rowLenght - 1
            , iBotMid     = n + rowLenght + 0
            , iBotRight   = n + rowLenght + 1; 


            if (iTopLeft >= 0 && x != 0 && jaggedArray[y][x].type != enWall && canDiagonal) { // top left
                
                connections.set(iTopLeft, diagonalCost);
            }
            if (iTopMid >= 0 && jaggedArray[y][x].type != enWall) { // top middle
                connections.set(iTopMid, normalCost);
            }
            if (iTopRight >= 0 && x != rowLenght - 1 && jaggedArray[y][x].type != enWall && canDiagonal) { // top right
                connections.set(iTopRight, diagonalCost);
            }
            if (x != 0 && jaggedArray[y][x].type != enWall) { // left
                connections.set(iLeft, normalCost);
            }
            if (x != rowLenght - 1 && jaggedArray[y][x].type != enWall) { // right
                connections.set(iRight, normalCost);
            }
            if (iBotLeft <= nMax && x != 0 && jaggedArray[y][x].type != enWall && canDiagonal) { // bot left
                connections.set(iBotLeft, diagonalCost);
            }
            if (iBotMid <= nMax &&  jaggedArray[y][x].type != enWall) { // bot middle
                connections.set(iBotMid, normalCost);
            }
            if (iBotRight <= nMax && x != rowLenght - 1 && jaggedArray[y][x].type != enWall && canDiagonal) { // bot right
                connections.set(iBotRight, diagonalCost);
            }
            
            graph.addNode(n, connections)
            n++;
        }
    }

    //console.log("nMax: " + nMax);
    //console.log(graph);
    return graph;
}
function GetCombinedTileCost(){
    if (path == null){
        return;
    }
    
    var cost = 0;
    var diagonals = 0;
    var normals = 0;

    for (let i = 1; i < path.length; i++ ) {
        var lastCords = Object.values(path[i-1]);
        var curCords = Object.values(path[i]);
        
        if (path[i-1].x - 1 == path[i].x || path[i-1].x + 1 == path[i].x) { // left or right
            if (path[i-1].y == path[i].y) { // if they have the same y then it cant have moved up or down
                cost += 10;
                normals +=1;
            }
            else { // if y arent equal then it moved diagonal.
                cost += 14;
                diagonals +=1;
            }
        }
        else { // moved up or down.
            cost += 10;
            normals +=1;
        }
    }
    costTaken = cost;
    lenghtTaken = "Normal steps taken: " + normals + " steps<br>Diagonal steps taken: " + diagonals;
}
function printMeasuredData(){

    document.getElementById("result1").innerHTML = "Time Taken: " + (Math.round((timeTaken + Number.EPSILON) * 1000) / 1000) + "ms";
    document.getElementById("result2").innerHTML = "Cost Taken: " + costTaken; 
    document.getElementById("result3").innerHTML = lenghtTaken;
}

/*function findOfType(target = enTarget){
    var returnArray = [];
    for (let y = 0; y < gridArray.length; y++) {
        for (let x = 0; x < gridArray[y].length; x++) {
            if (gridArray[y][x].type == target && !multiple) {
                
            }
        }
    }
}*/

class Tile {
    constructor( x, y, element, type){
        this.y = y;
        this.x = x;
        this.element = element;
        this.type = type
    }
}
},{"easystarjs":1,"node-dijkstra":6}]},{},[11]);
