module.exports = function(grunt){

  require('load-grunt-tasks')(grunt);

  var pkg = require("./package.json");

  var banner = `(function(factory) {
    
    // Establish the root object, window (self) in the browser, or global on the server.
    // We use self instead of window for WebWorker support.
    var root = (typeof self == 'object' && self.self === self && self) ||
        (typeof module == 'object' && module);

    // Set up Budgie appropriately for the environment. Start with AMD.
    if (typeof define === 'function' && define.amd) {
      define('Budgie', ['exports'], function(exports) {
        // Export global even in AMD case in case this script is loaded with
        // others that may still expect a global Budgie.
        root.Budgie = factory();
        // return Budgie for correct AMD use
        return root.Budgie;
      });

      // Next for Node.js or CommonJS.
    } else if (typeof exports !== 'undefined') {
        root.exports = factory();
      // Finally, as a browser global.
    } else {
      root.Budgie = factory();
    }

  })(function() {
  `;

  var footer = `
    return Budgie;
  });`;

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    connect: {
      test: {
        options: {
          port: 8001,
          hostname: '*'
        }
      }
    },

    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: ['js/**/*.js'],
        dest: 'dist/<%= pkg.name %>.concat.js'
      }
    },

    uglify: {
      options: {
        mangle: false,
        beautify: true,
        "indent-level" : 2,
        width : 120,
        semicolons: false,
        quote_style: 1,
        wrap: false,
        sourceMap : true,
        sourceMapName : 'dist/<%= pkg.name %>.es6.map',
        banner: "/*Budgie v"+pkg.version+"*/\n" + banner,
        footer: footer
      },
      budgie: {
        files: {
          'dist/<%= pkg.name %>.min.js': ['dist/<%= pkg.name %>.js'],
          'docs/budgie.min.js': ['dist/<%= pkg.name %>.js']
        }
      },
      budgiemodule: {
        options: {
          banner: "/*Budgie ES6 Module v"+pkg.version+"*/\nexport default Budgie = (function() {\n ",
          footer:`
            return Budgie;
          })();`
        },
        files: {
          'dist/budgie.module.js': ['dist/<%= pkg.name %>.js']
        }
      }
    },
    babel: {
      options: {
        sourceMap: true,
        presets: ['babel-preset-es2015']
      },
      dist: {
        files: {
          'dist/<%= pkg.name %>.js': '<%= concat.dist.dest %>',
        }
      }
    },
    jshint: {
      files: ['Gruntfile.js', 'js/**/*.js'],
    },

    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['build']
    },

  });

  grunt.registerTask('default', ['jshint','build'])
  grunt.registerTask('dev', ['build', 'connect','watch'])
  grunt.registerTask('build', ['concat', 'babel', 'uglify'])
}
