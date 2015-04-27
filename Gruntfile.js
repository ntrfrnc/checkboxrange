module.exports = function (grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.name %> v<%= pkg.version %> ' +
            '[<%= grunt.template.today("dd-mm-yyyy") %>] | ' +
            '(c) <%= pkg.author %> | <%= pkg.license %> license */',
    'string-replace': {
      title: {
        files: {
          'dist/': ['dist/<%= pkg.name %>.js', 'dist/<%= pkg.name %>.css']
        },
        options: {
          replacements: [
            {
              pattern: /(\/\*\!.*\\*\/)|(\/\/\[\[TITLE\]\])/i,
              replacement: '<%= banner %>'
            }
          ]
        }
      },
      version: {
        files: {
          './': ['README.md', 'demo.html']
        },
        options: {
          replacements: [
            {
              pattern: /(\<b\>|\*\*)?Version:(\<\/b\>|\*\*)? (\<span\>)?[\.\-0-9a-zA-z]+(\<\/span\>)?( *\n)/,
              replacement: '$1Version:$2 $3<%= pkg.version %>$4$5'
            }
          ]
        }
      },
      rmprefixes: {
        files: {
          'dist/': 'dist/<%= pkg.name %>.css',
          './': 'demo.css'
        },
        options: {
          replacements: [
            {
              pattern: /^[^@\n\r]*\-((webkit)|(moz)|(ms)|(o))\-.*\n/gm,
              replacement: ''
            }
          ]
        }
      }
    },
    autoprefixer: {
      options: {
        cascade: false
      },
      dist: {
        src: 'dist/<%= pkg.name %>.css'
      },
      demo: {
        src: 'demo.css'
      }
    },
    uglify: {
      options: {
        preserveComments: 'some'
      },
      build: {
        src: 'dist/<%= pkg.name %>.js',
        dest: 'dist/<%= pkg.name %>.min.js'
      }
    },
    cssmin: {
      target: {
        files: [{
            expand: true,
            cwd: 'dist',
            src: ['*.css', '!*.min.css'],
            dest: 'dist',
            ext: '.min.css'
          }]
      }
    }
  });

  grunt.loadNpmTasks('grunt-autoprefixer');
  grunt.loadNpmTasks('grunt-string-replace');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  // Default task(s).
  grunt.registerTask('default', ['autoprefixer', 'uglify', 'cssmin']);
  grunt.registerTask('rebuild', ['string-replace', 'autoprefixer', 'uglify', 'cssmin']);
  grunt.registerTask('css', ['autoprefixer', 'cssmin']);
  grunt.registerTask('cssrebuild', ['string-replace:rmprefixes', 'autoprefixer', 'cssmin']);
  grunt.registerTask('vup', ['string-replace:title', 'string-replace:version', 'uglify', 'cssmin']);

};
