module.exports = function(grunt) {

    grunt.initConfig({
        jade: {
            compile: {
                options: {
                    pretty: true,
                    data: {
                        debug: false
                    }
                },
                files: {
                    "view/4x3_1.html": ["view/src/4x3_1.jade"],
                    "view/4x3_2.html": ["view/src/4x3_2.jade"],
                    "view/4x3_3.html": ["view/src/4x3_3.jade"],
                    "view/4x3_4.html": ["view/src/4x3_4.jade"],
                    "view/16x9_1.html": ["view/src/16x9_1.jade"],
                    "view/16x9_2.html": ["view/src/16x9_2.jade"],
                    "view/16x9_3.html": ["view/src/16x9_3.jade"]
                }
            }
        },
        watch: {
            files: ['view/src/**/*.jade'],
            tasks: ['jade']
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jade');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['jade']);

};