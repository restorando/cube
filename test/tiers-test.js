'use strict';

var vows        = require("vows"),
    assert      = require("assert"),
    tiers       = require("../lib/cube/tiers");

var suite = vows.describe("tiers");

suite.addBatch({

  "tiers": {
    "contains exactly the expected tiers": function() {
      var keys = [];
      for (var key in tiers) {
        keys.push(+key);
      }
      keys.sort(function(a, b) { return a - b; });
      assert.deepEqual(keys, [1e4, 6e4, 3e5, 36e5, 864e5, 6048e5, 2592e6]);
    }
  },

  "second10": {
    topic: tiers[1e4],
    "has the key 1e4": function(tier) {
      assert.strictEqual(tier.key, 1e4);
    },
    "next is undefined": function(tier) {
      assert.isUndefined(tier.next);
    },
    "size is undefined": function(tier) {
      assert.isUndefined(tier.size);
    },

    "floor": {
      "rounds down to 10-seconds": function(tier) {
        assert.deepEqual(tier.floor(utc(2011,  8,  2, 12,  0, 20)), utc(2011,  8,  2, 12,  0, 20));
        assert.deepEqual(tier.floor(utc(2011,  8,  2, 12,  0, 21)), utc(2011,  8,  2, 12,  0, 20));
        assert.deepEqual(tier.floor(utc(2011,  8,  2, 12,  0, 23)), utc(2011,  8,  2, 12,  0, 20));
        assert.deepEqual(tier.floor(utc(2011,  8,  2, 12,  0, 39)), utc(2011,  8,  2, 12,  0, 30));
        assert.deepEqual(tier.floor(utc(2011,  8,  2, 12,  0, 40)), utc(2011,  8,  2, 12,  0, 40));
      },
      "does not modify the passed-in date": function(tier) {
        var date = utc(2011,  8,  2, 12,  0, 21);
        assert.deepEqual(tier.floor(date), utc(2011,  8,  2, 12,  0, 20));
        assert.deepEqual(date, utc(2011,  8,  2, 12,  0, 21));
      }
    },

    "ceil": {
      "rounds up to 10-seconds": function(tier) {
        assert.deepEqual(tier.ceil(utc(2011,  8,  2, 12,  0, 20)), utc(2011,  8,  2, 12,  0, 20));
        assert.deepEqual(tier.ceil(utc(2011,  8,  2, 12,  0, 21)), utc(2011,  8,  2, 12,  0, 30));
        assert.deepEqual(tier.ceil(utc(2011,  8,  2, 12,  0, 23)), utc(2011,  8,  2, 12,  0, 30));
        assert.deepEqual(tier.ceil(utc(2011,  8,  2, 12,  0, 39)), utc(2011,  8,  2, 12,  0, 40));
        assert.deepEqual(tier.ceil(utc(2011,  8,  2, 12,  0, 40)), utc(2011,  8,  2, 12,  0, 40));
      },
      "does not modified the specified date": function(tier) {
        var date = utc(2011,  8,  2, 12,  0, 21);
        assert.deepEqual(tier.ceil(date), utc(2011,  8,  2, 12,  0, 30));
        assert.deepEqual(date, utc(2011,  8,  2, 12,  0, 21));
      }
    },

    "step": {
      "increments time by ten seconds": function(tier) {
        var date = utc(2011,  8,  2, 23, 59, 20);
        assert.deepEqual(date = tier.step(date), utc(2011,  8,  2, 23, 59, 30));
        assert.deepEqual(date = tier.step(date), utc(2011,  8,  2, 23, 59, 40));
        assert.deepEqual(date = tier.step(date), utc(2011,  8,  2, 23, 59, 50));
        assert.deepEqual(date = tier.step(date), utc(2011,  8,  3,  0,  0,  0));
        assert.deepEqual(date = tier.step(date), utc(2011,  8,  3,  0,  0, 10));
        assert.deepEqual(date = tier.step(date), utc(2011,  8,  3,  0,  0, 20));
      },
      "does not round the specified date": function(tier) {
        assert.deepEqual(tier.step(utc(2011,  8,  2, 12, 21, 23)), utc(2011,  8,  2, 12, 21, 33));
      },
      "does not modify the specified date": function(tier) {
        var date = utc(2011,  8,  2, 12, 20,  0);
        assert.deepEqual(tier.step(date), utc(2011,  8,  2, 12, 20, 10));
        assert.deepEqual(date, utc(2011,  8,  2, 12, 20,  0));
      }
    }
  },

  "minute": {
    topic: tiers[6e4],
    "has the key 6e4": function(tier) {
      assert.strictEqual(tier.key, 6e4);
    },
    "next is the 10-second tier": function(tier) {
      assert.equal(tier.next, tiers[1e4]);
    },
    "size is 6": function(tier) {
      assert.strictEqual(tier.size(), 6);
    },
    "floor": {
      "rounds down to minutes": function(tier) {
        assert.deepEqual(tier.floor(utc(2011,  8,  2, 12, 20,  0)), utc(2011,  8,  2, 12, 20));
        assert.deepEqual(tier.floor(utc(2011,  8,  2, 12, 20,  1)), utc(2011,  8,  2, 12, 20));
        assert.deepEqual(tier.floor(utc(2011,  8,  2, 12, 21,  0)), utc(2011,  8,  2, 12, 21));
        assert.deepEqual(tier.floor(utc(2011,  8,  2, 12, 23,  0)), utc(2011,  8,  2, 12, 23));
        assert.deepEqual(tier.floor(utc(2011,  8,  2, 12, 24, 59)), utc(2011,  8,  2, 12, 24));
        assert.deepEqual(tier.floor(utc(2011,  8,  2, 12, 25,  0)), utc(2011,  8,  2, 12, 25));
      },
      "does not modify the passed-in date": function(tier) {
        var date = utc(2011,  8,  2, 12, 21, 20);
        assert.deepEqual(tier.floor(date), utc(2011,  8,  2, 12, 21));
        assert.deepEqual(date, utc(2011,  8,  2, 12, 21, 20));
      }
    },

    "ceil": {
      "rounds up to minutes": function(tier) {
        assert.deepEqual(tier.ceil(utc(2011,  8,  2, 12, 20,  0)), utc(2011,  8,  2, 12, 20));
        assert.deepEqual(tier.ceil(utc(2011,  8,  2, 12, 20,  1)), utc(2011,  8,  2, 12, 21));
        assert.deepEqual(tier.ceil(utc(2011,  8,  2, 12, 21,  0)), utc(2011,  8,  2, 12, 21));
        assert.deepEqual(tier.ceil(utc(2011,  8,  2, 12, 23,  0)), utc(2011,  8,  2, 12, 23));
        assert.deepEqual(tier.ceil(utc(2011,  8,  2, 12, 24, 59)), utc(2011,  8,  2, 12, 25));
        assert.deepEqual(tier.ceil(utc(2011,  8,  2, 12, 25,  0)), utc(2011,  8,  2, 12, 25));
      },
      "does not modified the specified date": function(tier) {
        var date = utc(2011,  8,  2, 12, 21, 20);
        assert.deepEqual(tier.ceil(date), utc(2011,  8,  2, 12, 22));
        assert.deepEqual(date, utc(2011,  8,  2, 12, 21, 20));
      }
    },

    "step": {
      "increments time by one minute": function(tier) {
        var date = utc(2011,  8,  2, 23, 45,  0);
        assert.deepEqual(date = tier.step(date), utc(2011,  8,  2, 23, 46));
        assert.deepEqual(date = tier.step(date), utc(2011,  8,  2, 23, 47));
        assert.deepEqual(date = tier.step(date), utc(2011,  8,  2, 23, 48));
        assert.deepEqual(date = tier.step(date), utc(2011,  8,  2, 23, 49));
        assert.deepEqual(date = tier.step(date), utc(2011,  8,  2, 23, 50));
      },
      "does not round the specified date": function(tier) {
        assert.deepEqual(tier.step(utc(2011,  8,  2, 12, 21, 23)), utc(2011,  8,  2, 12, 22, 23));
      },
      "does not modify the specified date": function(tier) {
        var date = utc(2011,  8,  2, 12, 20);
        assert.deepEqual(tier.step(date), utc(2011,  8,  2, 12, 21));
        assert.deepEqual(date, utc(2011,  8,  2, 12, 20));
      }
    }
  },

  "minute5": {
    topic: tiers[3e5],
    "has the key 3e5": function(tier) {
      assert.strictEqual(tier.key, 3e5);
    },
    "next is the minute tier": function(tier) {
      assert.equal(tier.next, tiers[6e4]);
    },
    "size is 5": function(tier) {
      assert.strictEqual(tier.size(), 5);
    },

    "floor": {
      "rounds down to 5-minutes": function(tier) {
        assert.deepEqual(tier.floor(utc(2011,  8,  2, 12, 20,  0)), utc(2011,  8,  2, 12, 20));
        assert.deepEqual(tier.floor(utc(2011,  8,  2, 12, 20,  1)), utc(2011,  8,  2, 12, 20));
        assert.deepEqual(tier.floor(utc(2011,  8,  2, 12, 21,  0)), utc(2011,  8,  2, 12, 20));
        assert.deepEqual(tier.floor(utc(2011,  8,  2, 12, 23,  0)), utc(2011,  8,  2, 12, 20));
        assert.deepEqual(tier.floor(utc(2011,  8,  2, 12, 24, 59)), utc(2011,  8,  2, 12, 20));
        assert.deepEqual(tier.floor(utc(2011,  8,  2, 12, 25,  0)), utc(2011,  8,  2, 12, 25));
      },
      "does not modify the passed-in date": function(tier) {
        var date = utc(2011,  8,  2, 12, 21);
        assert.deepEqual(tier.floor(date), utc(2011,  8,  2, 12, 20));
        assert.deepEqual(date, utc(2011,  8,  2, 12, 21));
      }
    },

    "ceil": {
      "rounds up to 5-minutes": function(tier) {
        assert.deepEqual(tier.ceil(utc(2011,  8,  2, 12, 20,  0)), utc(2011,  8,  2, 12, 20));
        assert.deepEqual(tier.ceil(utc(2011,  8,  2, 12, 20,  1)), utc(2011,  8,  2, 12, 25));
        assert.deepEqual(tier.ceil(utc(2011,  8,  2, 12, 21,  0)), utc(2011,  8,  2, 12, 25));
        assert.deepEqual(tier.ceil(utc(2011,  8,  2, 12, 23,  0)), utc(2011,  8,  2, 12, 25));
        assert.deepEqual(tier.ceil(utc(2011,  8,  2, 12, 24, 59)), utc(2011,  8,  2, 12, 25));
        assert.deepEqual(tier.ceil(utc(2011,  8,  2, 12, 25,  0)), utc(2011,  8,  2, 12, 25));
      },
      "does not modified the specified date": function(tier) {
        var date = utc(2011,  8,  2, 12, 21,  0);
        assert.deepEqual(tier.ceil(date), utc(2011,  8,  2, 12, 25));
        assert.deepEqual(date, utc(2011,  8,  2, 12, 21));
      }
    },

    "step": {
      "increments time by five minutes": function(tier) {
        var date = utc(2011,  8,  2, 23, 45,  0);
        assert.deepEqual(date = tier.step(date), utc(2011,  8,  2, 23, 50));
        assert.deepEqual(date = tier.step(date), utc(2011,  8,  2, 23, 55));
        assert.deepEqual(date = tier.step(date), utc(2011,  8,  3,  0,  0));
        assert.deepEqual(date = tier.step(date), utc(2011,  8,  3,  0,  5));
        assert.deepEqual(date = tier.step(date), utc(2011,  8,  3,  0, 10));
      },
      "does not round the specified date": function(tier) {
        assert.deepEqual(tier.step(utc(2011,  8,  2, 12, 21, 23)), utc(2011,  8,  2, 12, 26, 23));
      },
      "does not modify the specified date": function(tier) {
        var date = utc(2011,  8,  2, 12, 20,  0);
        assert.deepEqual(tier.step(date), utc(2011,  8,  2, 12, 25));
        assert.deepEqual(date, utc(2011,  8,  2, 12, 20));
      }
    }
  },

  "hour": {
    topic: tiers[36e5],
    "has the key 36e5": function(tier) {
      assert.strictEqual(tier.key, 36e5);
    },
    "next is the 5-minute tier": function(tier) {
      assert.equal(tier.next, tiers[3e5]);
    },
    "size is 12": function(tier) {
      assert.strictEqual(tier.size(), 12);
    },

    "floor": {
      "rounds down to hours": function(tier) {
        assert.deepEqual(tier.floor(utc(2011,  8,  2, 12,  0,  0)), utc(2011,  8,  2, 12,  0));
        assert.deepEqual(tier.floor(utc(2011,  8,  2, 12,  0,  1)), utc(2011,  8,  2, 12,  0));
        assert.deepEqual(tier.floor(utc(2011,  8,  2, 12, 21,  0)), utc(2011,  8,  2, 12,  0));
        assert.deepEqual(tier.floor(utc(2011,  8,  2, 12, 59, 59)), utc(2011,  8,  2, 12,  0));
        assert.deepEqual(tier.floor(utc(2011,  8,  2, 13,  0,  0)), utc(2011,  8,  2, 13,  0));
      },
      "does not modify the passed-in date": function(tier) {
        var date = utc(2011,  8,  2, 12, 21);
        assert.deepEqual(tier.floor(date), utc(2011,  8,  2, 12,  0));
        assert.deepEqual(date, utc(2011,  8,  2, 12, 21));
      }
    },

    "ceil": {
      "rounds up to hours": function(tier) {
        assert.deepEqual(tier.ceil(utc(2011,  8,  2, 12,  0,  0)), utc(2011,  8,  2, 12,  0));
        assert.deepEqual(tier.ceil(utc(2011,  8,  2, 12,  0,  1)), utc(2011,  8,  2, 13,  0));
        assert.deepEqual(tier.ceil(utc(2011,  8,  2, 12, 21,  0)), utc(2011,  8,  2, 13,  0));
        assert.deepEqual(tier.ceil(utc(2011,  8,  2, 12, 59, 59)), utc(2011,  8,  2, 13,  0));
        assert.deepEqual(tier.ceil(utc(2011,  8,  2, 13,  0,  0)), utc(2011,  8,  2, 13,  0));
      },
      "does not modified the specified date": function(tier) {
        var date = utc(2011,  8,  2, 12, 21,  0);
        assert.deepEqual(tier.ceil(date), utc(2011,  8,  2, 13,  0));
        assert.deepEqual(date, utc(2011,  8,  2, 12, 21));
      }
    },

    "step": {
      "increments time by one hour": function(tier) {
        var date = utc(2011,  8,  2, 22,  0,  0);
        assert.deepEqual(date = tier.step(date), utc(2011,  8,  2, 23,  0));
        assert.deepEqual(date = tier.step(date), utc(2011,  8,  3,  0,  0));
        assert.deepEqual(date = tier.step(date), utc(2011,  8,  3,  1,  0));
        assert.deepEqual(date = tier.step(date), utc(2011,  8,  3,  2,  0));
        assert.deepEqual(date = tier.step(date), utc(2011,  8,  3,  3,  0));
      },
      "does not round the specified date": function(tier) {
        assert.deepEqual(tier.step(utc(2011,  8,  2, 12, 21, 23)), utc(2011,  8,  2, 13, 21, 23));
      },
      "does not modify the specified date": function(tier) {
        var date = utc(2011,  8,  2, 12,  0,  0);
        assert.deepEqual(tier.step(date), utc(2011,  8,  2, 13,  0));
        assert.deepEqual(date, utc(2011,  8,  2, 12,  0));
      }
    }
  },

  "day": {
    topic: tiers[864e5],
    "has the key 864e5": function(tier) {
      assert.strictEqual(tier.key, 864e5);
    },
    "next is the one-hour tier": function(tier) {
      assert.equal(tier.next, tiers[36e5]);
    },
    "size is 24": function(tier) {
      assert.strictEqual(tier.size(), 24);
    },

    "floor": {
      "rounds down to days": function(tier) {
        assert.deepEqual(tier.floor(utc(2011,  8,  2,  0,  0,  0)), utc(2011,  8,  2,  0,  0));
        assert.deepEqual(tier.floor(utc(2011,  8,  2,  0,  0,  1)), utc(2011,  8,  2,  0,  0));
        assert.deepEqual(tier.floor(utc(2011,  8,  2, 12, 21,  0)), utc(2011,  8,  2,  0,  0));
        assert.deepEqual(tier.floor(utc(2011,  8,  2, 23, 59, 59)), utc(2011,  8,  2,  0,  0));
        assert.deepEqual(tier.floor(utc(2011,  8,  3,  0,  0,  0)), utc(2011,  8,  3,  0,  0));
      },
      "does not modify the passed-in date": function(tier) {
        var date = utc(2011,  8,  2, 12, 21);
        assert.deepEqual(tier.floor(date), utc(2011,  8,  2,  0,  0));
        assert.deepEqual(date, utc(2011,  8,  2, 12, 21));
      }
    },

    "ceil": {
      "rounds up to days": function(tier) {
        assert.deepEqual(tier.ceil(utc(2011,  8,  2,  0,  0,  0)), utc(2011,  8,  2,  0,  0));
        assert.deepEqual(tier.ceil(utc(2011,  8,  2,  0,  0,  1)), utc(2011,  8,  3,  0,  0));
        assert.deepEqual(tier.ceil(utc(2011,  8,  2, 12, 21,  0)), utc(2011,  8,  3,  0,  0));
        assert.deepEqual(tier.ceil(utc(2011,  8,  2, 23, 59, 59)), utc(2011,  8,  3,  0,  0));
        assert.deepEqual(tier.ceil(utc(2011,  8,  3,  0,  0,  0)), utc(2011,  8,  3,  0,  0));
      },
      "does not modified the specified date": function(tier) {
        var date = utc(2011,  8,  2, 12, 21,  0);
        assert.deepEqual(tier.ceil(date), utc(2011,  8,  3,  0,  0));
        assert.deepEqual(date, utc(2011,  8,  2, 12, 21));
      }
    },

    "step": {
      "increments time by one day": function(tier) {
        var date = utc(2011,  8,  2,  0,  0,  0);
        assert.deepEqual(date = tier.step(date), utc(2011,  8,  3,  0,  0));
        assert.deepEqual(date = tier.step(date), utc(2011,  8,  4,  0,  0));
        assert.deepEqual(date = tier.step(date), utc(2011,  8,  5,  0,  0));
        assert.deepEqual(date = tier.step(date), utc(2011,  8,  6,  0,  0));
        assert.deepEqual(date = tier.step(date), utc(2011,  8,  7,  0,  0));
      },
      "does not round the specified date": function(tier) {
        assert.deepEqual(tier.step(utc(2011,  8,  2, 12, 21, 23)), utc(2011,  8,  3, 12, 21, 23));
      },
      "does not modify the specified date": function(tier) {
        var date = utc(2011,  8,  2,  0,  0,  0);
        assert.deepEqual(tier.step(date), utc(2011,  8,  3,  0,  0));
        assert.deepEqual(date, utc(2011,  8,  2,  0,  0));
      }
    }
  },

  "week": {
    topic: tiers[6048e5],
    "has the key 6048e5": function(tier) {
      assert.strictEqual(tier.key, 6048e5);
    },
    "next is the one-day tier": function(tier) {
      assert.equal(tier.next, tiers[864e5]);
    },
    "size is 7": function(tier) {
      assert.strictEqual(tier.size(), 7);
    },

    "floor": {
      "rounds down to weeks": function(tier) {
        assert.deepEqual(tier.floor(new Date(2013, 6, 1, 0, 0, 0)), new Date(2013, 6, 1, 0, 0, 0));
        assert.deepEqual(tier.floor(new Date(2013, 6, 1, 0, 0, 1)), new Date(2013, 6, 1, 0, 0, 0));
        assert.deepEqual(tier.floor(new Date(2013, 6, 3, 12, 30, 1)), new Date(2013, 6, 1, 0, 0, 0));
        assert.deepEqual(tier.floor(new Date(2013, 6, 7, 23, 59, 59)), new Date(2013, 6, 1, 0, 0, 0));
        assert.deepEqual(tier.floor(new Date(2013, 6, 8, 0, 0, 0)), new Date(2013, 6, 8, 0, 0, 0));
      },
      "does not modify the passed-in date": function(tier) {
        var date = new Date(2013, 6, 2, 12, 21,0);
        assert.deepEqual(tier.floor(date), new Date(2013, 6, 1, 0, 0, 0));
        assert.deepEqual(date, new Date(2013, 6, 2, 12, 21, 0));
      }
    },

    "ceil": {
      "rounds up to weeks": function(tier) {
        assert.deepEqual(tier.ceil(new Date(2013, 6, 1, 0, 0, 1)), new Date(2013, 6, 8, 0, 0, 0));
        assert.deepEqual(tier.ceil(new Date(2013, 6, 3, 12, 21, 0)), new Date(2013, 6, 8, 0, 0, 0));
        assert.deepEqual(tier.ceil(new Date(2013, 6, 7, 23, 59, 59)), new Date(2013, 6, 8, 0, 0, 0));
        assert.deepEqual(tier.ceil(new Date(2013, 6, 8, 0, 0, 0)), new Date(2013, 6, 8, 0, 0, 0));
      },
      "does not modified the specified date": function(tier) {
        var date = new Date(2013, 6, 1, 12, 21, 0);
        assert.deepEqual(tier.ceil(date), new Date(2013, 6, 8, 0, 0, 0));
        assert.deepEqual(date, new Date(2013, 6, 1, 12, 21, 0));
      }
    },

    "step": {
      "increments time by one week": function(tier) {
        var date = new Date(2013, 6, 1, 0, 0, 0);
        assert.deepEqual(date = tier.step(date), new Date(2013, 6, 8, 0, 0, 0));
        assert.deepEqual(date = tier.step(date), new Date(2013, 6, 15, 0, 0, 0));
        assert.deepEqual(date = tier.step(date), new Date(2013, 6, 22, 0, 0, 0));
        assert.deepEqual(date = tier.step(date), new Date(2013, 6, 29, 0, 0, 0));
        assert.deepEqual(date = tier.step(date), new Date(2013, 7, 5, 0, 0, 0));
      },
      "does not round the specified date": function(tier) {
        assert.deepEqual(tier.step(new Date(2013, 6, 1, 12, 21, 23)), new Date(2013, 6, 8, 12, 21, 23));
      },
      "does not modify the specified date": function(tier) {
        var date = new Date(2013, 6, 1, 0, 0, 0);
        assert.deepEqual(tier.step(date), new Date(2013, 6, 8, 0, 0, 0));
        assert.deepEqual(date, new Date(2013, 6, 1, 0, 0, 0));
      }
    }
  },

  "month": {
    topic: tiers[24192e5],
    "has the key 2592e6": function(tier) {
      assert.strictEqual(tier.key, 2592e6);
    },
    "next is the one-day tier": function(tier) {
      assert.equal(tier.next, tiers[864e5]);
    },
    "size is the amount of days in the month": function(tier) {
      assert.strictEqual(tier.size(new Date(2013, 0, 12, 1, 30, 0)), 31);
      assert.strictEqual(tier.size(new Date(2013, 1, 20, 15, 0, 0)), 28);
      assert.strictEqual(tier.size(new Date(2013, 5, 8, 9, 0, 0)), 30);
    },

    "floor": {
      "rounds down to months": function(tier) {
        assert.deepEqual(tier.floor(new Date(2013, 6, 1, 0, 0, 1)), new Date(2013, 6, 1, 0, 0, 0));
        assert.deepEqual(tier.floor(new Date(2013, 6, 15, 12, 30, 1)), new Date(2013, 6, 1, 0, 0, 0));
        assert.deepEqual(tier.floor(new Date(2013, 6, 31, 23, 59, 59)), new Date(2013, 6, 1, 0, 0, 0));
        assert.deepEqual(tier.floor(new Date(2013, 7, 1, 0, 0, 0)), new Date(2013, 7, 1, 0, 0, 0));
      },
      "does not modify the passed-in date": function(tier) {
        var date = new Date(2013, 6, 2, 12, 21,0);
        assert.deepEqual(tier.floor(date), new Date(2013, 6, 1, 0, 0, 0));
        assert.deepEqual(date, new Date(2013, 6, 2, 12, 21, 0));
      }
    },

    "ceil": {
      "rounds up to months": function(tier) {
        assert.deepEqual(tier.ceil(new Date(2013, 6, 1, 0, 0, 1)), new Date(2013, 7, 1, 0, 0, 0));
        assert.deepEqual(tier.ceil(new Date(2013, 6, 15, 12, 21, 0)), new Date(2013, 7, 1, 0, 0, 0));
        assert.deepEqual(tier.ceil(new Date(2013, 6, 31, 23, 59, 59)), new Date(2013, 7, 1, 0, 0, 0));
        assert.deepEqual(tier.ceil(new Date(2013, 7, 1, 0, 0, 0)), new Date(2013, 7, 1, 0, 0, 0));
      },
      "does not modified the specified date": function(tier) {
        var date = new Date(2013, 6, 1, 12, 21, 0);
        assert.deepEqual(tier.ceil(date), new Date(2013, 7, 1, 0, 0, 0));
        assert.deepEqual(date, new Date(2013, 6, 1, 12, 21, 0));
      }
    },

    "step": {
      "increments time by one month": function(tier) {
        var date = new Date(2013, 8, 1, 0, 0, 0);
        assert.deepEqual(date = tier.step(date), new Date(2013, 9, 1, 0, 0, 0));
        assert.deepEqual(date = tier.step(date), new Date(2013, 10, 1, 0, 0, 0));
        assert.deepEqual(date = tier.step(date), new Date(2013, 11, 1, 0, 0, 0));
        assert.deepEqual(date = tier.step(date), new Date(2014, 0, 1, 0, 0, 0));
        assert.deepEqual(date = tier.step(date), new Date(2014, 1, 1, 0, 0, 0));
      },
      "does not modify the specified date": function(tier) {
        var date = new Date(2013, 6, 1, 0, 0, 0);
        assert.deepEqual(tier.step(date), new Date(2013, 7, 1, 0, 0, 0));
        assert.deepEqual(date, new Date(2013, 6, 1, 0, 0, 0));
      }
    }

  }

});

function utc(year, month, day, hours, minutes, seconds) {
  return new Date(Date.UTC(year, month, day, hours || 0, minutes || 0, seconds || 0));
}

suite['export'](module);
