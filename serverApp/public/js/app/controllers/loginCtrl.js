app.controller("loginCtrl", ['$scope', '$rootScope', '$cookies', '$state', '$transitions', 'Login', function($scope, $rootScope, $cookies, $state, $transitions, Login) {
    $scope.user = {};
    $scope.login_error = null;
    $scope.makingAjaxCall = false;
    $rootScope.button = false;

    $scope.login = function() {
        $scope.makingAjaxCall = true;
        Login.save($scope.user, function(response, headers) {
            console.log(response);
            var jwt = response.auth_token;
            $rootScope.auth_token = jwt;
            $cookies.put('auth_token', jwt);
            $cookies.putObject("user", { name: response.name, userId: response.userId, acc_loc: response.acc_location, isAdmin: response.isAdmin, isActive: response.isActive });
            $scope.makingAjaxCall = false;
            $state.go('index.ldashboard');
        }, function(err) {
            $rootScope.showToast(err.data.err, 'error-toast');
            $scope.login_error = err.data.err;
            $scope.makingAjaxCall = false;
        })
    }

    $scope.$on('$viewContentLoaded', function() {
        setTimeout(function() {
            particlesJS('particleJs', {
                "particles": {
                    "number": {
                        "value": 100,
                        "density": {
                            "enable": true,
                            "value_area": 700
                        }
                    },
                    "color": {
                        "value": "#ffffff"
                    },
                    "shape": {
                        "type": "circle",
                        "stroke": {
                            "width": 0,
                            "color": "#000000"
                        },
                        "polygon": {
                            "nb_sides": 5
                        },
                        "image": {
                            "src": "img/github.svg",
                            "width": 100,
                            "height": 100
                        }
                    },
                    "opacity": {
                        "value": 0.5,
                        "random": true,
                        "anim": {
                            "enable": true,
                            "speed": 10,
                            "opacity_min": 0,
                            "sync": true
                        }
                    },
                    "size": {
                        "value": 3,
                        "random": true,
                        "anim": {
                            "enable": true,
                            "speed": 40,
                            "size_min": 0.1,
                            "sync": false
                        }
                    },
                    "line_linked": {
                        "enable": true,
                        "distance": 150,
                        "color": "#00937d",
                        "opacity": 1,
                        "width": 1
                    },
                    "move": {
                        "enable": true,
                        "speed": 6,
                        "direction": "none",
                        "random": true,
                        "straight": false,
                        "out_mode": "bounce",
                        "bounce": false,
                        "attract": {
                            "enable": true,
                            "rotateX": 160.3412060865523,
                            "rotateY": 1200
                        }
                    }
                },
                "interactivity": {
                    "detect_on": "canvas",
                    "events": {
                        "onhover": {
                            "enable": true,
                            "mode": "repulse"
                        },
                        "onclick": {
                            "enable": true,
                            "mode": "push"
                        },
                        "resize": true
                    },
                    "modes": {
                        "grab": {
                            "distance": 400,
                            "line_linked": {
                                "opacity": 1
                            }
                        },
                        "bubble": {
                            "distance": 400,
                            "size": 40,
                            "duration": 2,
                            "opacity": 8,
                            "speed": 3
                        },
                        "repulse": {
                            "distance": 200,
                            "duration": 0.4
                        },
                        "push": {
                            "particles_nb": 4
                        },
                        "remove": {
                            "particles_nb": 2
                        }
                    }
                },
                "retina_detect": true
            });
        }, 10)
    })
}])