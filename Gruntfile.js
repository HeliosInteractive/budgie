module.exports = function(grunt){

  require('load-grunt-tasks')(grunt);

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
        sourceMap : true,
        sourceMapName : 'dist/<%= pkg.name %>.es6.map',
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },
      dist: {
        files: {
          'dist/<%= pkg.name %>.min.js': ['dist/<%= pkg.name %>.js']
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
          'dist/<%= pkg.name %>.js': '<%= concat.dist.dest %>'
        }
      }
    },
    jshint: {
      files: ['Gruntfile.js', 'js/**/*.js'],
    },

    watch: {
      files: ['<%= jshint.files %>','styles/**/*.scss'],
      tasks: ['build']
    },

    sass: {
      dist:{
        options: {
          style: 'expanded'
        },
        files: {
          'dist/main.css':'styles/main.scss'
        }
      }
    }
  });

  grunt.registerTask('default', ['jshint','build'])
  grunt.registerTask('dev', ['build', 'connect','watch'])
  grunt.registerTask('build', ['concat', 'babel', 'uglify', 'sass'])
}