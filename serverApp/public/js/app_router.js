var app = angular.module("adappt_occ_app", ['ngResource', 'ngMaterial', 'ngMaterialDateRangePicker', 'ngCookies', 'ui.router', 'ngMessages', 'uiGmapgoogle-maps', 'easypiechart', 'rzModule', 'ui.grid', 'ui.grid.resizeColumns', 'ui.grid.edit', 'ui.grid.autoResize', 'mobiscroll-datetime', 'ui.grid.selection', 'ngFileUpload', 'vAccordion', 'ngAnimate', 'ui.grid.exporter', 'md.data.table', 'sb.checkbox', 'ngSelectable']);

app.config(['$stateProvider', '$urlRouterProvider', '$resourceProvider', '$locationProvider', function($stateProvider, $urlRouterProvider, $resourceProvider, $locationProvider) {


        $resourceProvider.defaults.stripTrailingSlashes = false;
        $locationProvider.html5Mode(true);
        $urlRouterProvider.otherwise('/error');

        var checkLogin = function($rootScope, $state) {
            //$rootScope.logout();
            if (!$rootScope.auth_token) {
                $state.go('login');
            }
        }

        $stateProvider
            .state('login', {
                url: '/login',
                templateUrl: 'template/login',
                controller: 'loginCtrl',
                resolve: {
                    check: function($rootScope, $state) {
                        if ($rootScope.auth_token)
                            $state.go('index.ldashboard')
                    }
                }
            })
            .state('profile', {
                url: '/profile',
                templateUrl: 'template/profile',
                controller: 'profileCtrl',
                resolve: {
                    check: checkLogin
                }
            })
            .state('changePassword', {
                url: '/changePassword',
                templateUrl: 'template/changepassword',
                controller: 'changePasswordCtrl'
            })
            .state('layout', {
                url: '/layout/:bldgId',
                templateUrl: 'template/layout-analytics',
                controller: 'layoutCtrl',
                resolve: {
                    check: checkLogin
                }
            })
            .state('analytics', {
                url: '/analytics/:bldgId',
                templateUrl: 'template/analytics',
                controller: 'analyticsCtrl',
                resolve: {
                    check: checkLogin
                }
            })
            .state('seatAllocationAnalytics', {
                url: '/seatAllocationAnalytics/:bldgId',
                templateUrl: 'template/analytics_seatallocation',
                controller: 'seatAnalyticsCtrl',
                resolve: {
                    check: checkLogin
                }
            })
            .state('lightControl', {
                url: '/lightControl',
                templateUrl: 'template/lightcontrol1',
                controller: 'lightcontrol1'
            })

        .state('control1', {
                url: '/lightControl1/:bldgId',
                templateUrl: 'template/lightcontrol1',
                controller: 'lightcontrol1'
            })
            .state('lightAnalytics', {
                url: '/lightAnalytics/:bldgId',
                templateUrl: 'template/lightAnalytics',
                controller: 'lightAnalytics',
                resolve: {
                    check: checkLogin
                }
            })
            .state('layoutAnalytics', {
                url: '/densityLayout/:bldgId',
                templateUrl: 'template/densityLayout',
                controller: 'densityLayoutCtrl',
                resolve: {
                    check: checkLogin
                }
            })
            .state('lightSettings', {
                url: '/lightSettings',
                templateUrl: 'template/settings1',
                controller: 'settings1'
            })
            .state('settings1', {
                url: '/settings1/:bldgId',
                templateUrl: 'template/settings1',
                controller: 'settings1',
                resolve: {
                    check: checkLogin
                }
            })
            .state('/error', {
                url: '/error',
                templateUrl: 'template/error'
            })
            .state('comparision', {
                url: '/comparision',
                templateUrl: 'template/comparision_page',
                controller: 'comparisionCtrl',
                resolve: {
                    check: checkLogin
                }
            })
            .state('advancelayout', {
                url: '/advancelayout/:bldgId',
                templateUrl: 'template/advance-layout',
                controller: 'advancelayoutCtrl',
                resolve: {
                    check: checkLogin
                }
            })
            .state('assignPeople', {
                url: '/assignPeople',
                templateUrl: 'template/assignPeople',
                controller: 'assignpplCtrl',
                resolve: {
                    check: checkLogin
                }
            })
            .state('sensorMgt', {
                url: '/sensorMgt',
                templateUrl: 'template/sensormgt',
                controller: 'sensormgtCtrl',
                resolve: {
                    check: checkLogin
                }
            })
            .state('MeetingRoomMgt', {
                url: '/MeetingRoomMgt',
                templateUrl: 'template/meetingRoomMgt',
                controller: 'meetingRoomMgtCtrl',
                resolve: {
                    check: checkLogin
                }
            })
            .state('index', {
                abstract: true,
                url: '/',
                templateUrl: 'template/wireframe',
                controller: 'wireframeCtrl',
                resolve: {
                    check: checkLogin
                }
            })
            .state('index.dashboard', {
                url: '',
                templateUrl: 'template/dashboard',
                controller: 'dashboardCtrl',
                resolve: {
                    check: checkLogin
                }
            })

        .state('index.ldashboard', {
                url: 'ldashboard',
                templateUrl: 'template/lightDashboard',
                controller: 'lightDashboard',
                resolve: {
                    check: checkLogin
                }
            })
            .state('index.seatDashboard', {
                url: 'seatDashboard',
                templateUrl: 'template/seatDashboard',
                controller: 'seatDashboardCtrl',
                resolve: {
                    check: checkLogin
                }
            })
            .state('settings', {
                url: '/settings',
                templateUrl: 'template/settings',
                controller: 'settingsCtrl',
                resolve: {
                    check: checkLogin
                }
            })
            .state('empSettings', {
                url: '/empSettings',
                templateUrl: 'template/empSettings',
                controller: 'empSettingsCtrl',
                resolve: {
                    check: checkLogin
                }
            })
            .state('floorPeopleCounting', {
                url: '/floorPeopleCounting',
                templateUrl: 'template/floorPeopleCounting',
                controller: 'peopleCountCtrl',
                resolve: {
                    check: checkLogin
                }
            })
            .state('empDetails', {
                url: '/empDetails',
                templateUrl: 'template/employeeDetails',
                controller: 'empDetailsCtrl',
                resolve: {
                    check: checkLogin
                }
            })
            .state('commission', {
                abstract: true,
                url: '/',
                resolve: {
                    check: checkLogin
                }
            })
            .state('commission.index', {
                url: 'commission/index',
                templateUrl: 'template/commissionindex',
                controller: 'CommissionCtrl',
                resolve: {
                    check: checkLogin
                }
            })
            .state('commission.add', {
                url: 'commission/add',
                templateUrl: 'template/addcommission',
                controller: 'CommissionAddCtrl',
                resolve: {
                    check: checkLogin
                }
            })
            .state('commission.floor', {
                url: 'commission/floordetails',
                templateUrl: 'template/comfloor_details',
                controller: 'CommissionFloorCtrl',
                resolve: {
                    check: checkLogin
                }
            })
            /* .state('commission.host', {
                url: 'commission/host',
                templateUrl: 'template/addhost',
                controller: 'CommissionHostCtrl',
                resolve: {
                    check: checkLogin
                }
            }) */
            .state('commission.mapping', {

                url: 'commission/mapping',
                templateUrl: 'template/mapping',
                controller: 'mappingCtrl',
                resolve: {
                    check: checkLogin
                }
            })

        .state('commissionsettings', {
                url: '/commissionsettings',
                views: {

                    '@': {
                        templateUrl: 'template/commissionsettings',
                        controller: 'CommissionSettingCtrl'
                    }
                },
                resolve: {
                    check: checkLogin
                }
            })
            .state('commissionsettings.building', {
                url: '/building',
                views: {
                    'content@commissionsettings': {
                        templateUrl: 'template/buildingsettings',
                        controller: 'BuildingSettingCtrl'
                    }
                }
            })
            .state('commissionsettings.seattype', {
                url: '/seattypesettings',
                views: {
                    'content@commissionsettings': {
                        templateUrl: 'template/seattypesettings',
                        controller: 'SeatTypeSettingCtrl'
                    }
                }
            })
            .state('commissionsettings.seatmapping', {
                url: '/seatmapping',
                views: {
                    'content@commissionsettings': {
                        templateUrl: 'template/seatmapping',
                        controller: 'SeatMappingCtrl'
                    }
                }
            })
            .state('commissionsettings.bumapping', {
                url: '/bumapping',
                views: {
                    'content@commissionsettings': {
                        templateUrl: 'template/bumapping',
                        controller: 'BuMappingCtrl'
                    }
                }
            })
            .state('commissionsettings.employee', {
                url: '/employeedetails',
                views: {
                    'content@commissionsettings': {
                        templateUrl: 'template/empSettings',
                        controller: 'empSettingsCtrl'

                    }
                }
            })
            .state('commissionsettings.hostmapping', {
                url: '/hostmapping',
                views: {
                    'content@commissionsettings': {
                        templateUrl: 'template/hostmapping',
                        controller: 'HostMappingCtrl'
                    }
                }
            })
            .state('commissionsettings.lighttype', {
                url: '/lighttypesettings',
                views: {
                    'content@commissionsettings': {
                        templateUrl: 'template/lighttypesettings',
                        controller: 'LightTypeSettingCtrl'
                    }
                }
            })
            .state('commissionsettings.lightmapping', {
                url: '/lightmapping',
                views: {
                    'content@commissionsettings': {
                        templateUrl: 'template/lightmapping',
                        controller: 'LightMappingCtrl'
                    }
                }
            })
            .state('commissionsettings.lightdevicecreate', {
                url: '/lightdevicecreate',
                views: {
                    'content@commissionsettings': {
                        templateUrl: 'template/lightdevicecreate',
                        controller: 'LightDeviceCreationCtrl'
                    }
                }
            })
            .state('commissionsettings.lightaddressmap', {
                url: '/lightaddressmap',
                views: {
                    'content@commissionsettings': {
                        templateUrl: 'template/lightAddressMapping',
                        controller: 'LightAdddressMappingCtrl'
                    }
                }
            })
            .state('commissionsettings.lightblemapping', {
                url: '/lightblemapping',
                views: {
                    'content@commissionsettings': {
                        templateUrl: 'template/lightBleMapping',
                        controller: 'LightBleMappingCtrl'
                    }
                }
            })
            .state('commissionsettings.lightsensormapping', {
                url: '/lightsensormapping',
                views: {
                    'content@commissionsettings': {
                        templateUrl: 'template/lightsensormapping',
                        controller: 'LightSensorMappingCtrl'
                    }
                }
            })
            .state('commissionsettings.lighttouchpanelmapping', {
                url: '/lighttouchpanelmapping',
                views: {
                    'content@commissionsettings': {
                        templateUrl: 'template/lighttouchpanelmapping',
                        controller: 'LightTouchPanelMappingCtrl'
                    }
                }
            })
            .state('commissionsettings.lighthostmapping', {
                url: '/lighthostmapping',
                views: {
                    'content@commissionsettings': {
                        templateUrl: 'template/lighthostmapping',
                        controller: 'LightHostMappingCtrl'
                    }
                }
            })
            .state('commissionsettings.sendCommand', {
                url: '/sendCommand',
                views: {
                    'content@commissionsettings': {
                        templateUrl: 'template/sendCommand',
                        controller: 'sendCommandCtrl'
                    }
                }
            })
            .state('parkingAllotment', {
                url: '/parkingAllotment',
                templateUrl: 'template/parkingAllotment',
                controller: 'parkingAllotmentCtrl',
                resolve: {
                    check: checkLogin
                }
            })
            .state('lockerRoom', {
                url: '/lockerRoom',
                templateUrl: 'template/lockerRoom',
                controller: 'lockerRoomCtrl',
                resolve: {
                    check: checkLogin
                }
            })
            .state('commissionsettings.gss_settings', {
                url: '/gss_settings',
                views: {
                    'content@commissionsettings': {
                        templateUrl: 'template/settings1',
                        controller: 'settings1'
                    }
                }
            })
            .state('commissionsettings.lightconfdwnld', {
                url: '/lightconfdwnld',
                views: {
                    'content@commissionsettings': {
                        templateUrl: 'template/lightconfdwnld',
                        controller: 'lightConfDwnldCtrl'
                    }
                }
            })
            .state('commissionsettings.commissiondaylight', {
                url: '/commissiondaylight',
                views: {
                    'content@commissionsettings': {
                        templateUrl: 'template/commissiondaylight',
                        controller: 'commissiondaylightCtrl'
                    }
                }
            })
            .state('commissionsettings.reposettings', {
                url: '/reposettings',
                views: {
                    'content@commissionsettings': {
                        templateUrl: 'template/employeeDetails',
                        controller: 'empDetailsCtrl'
                    }
                }
            })
            .state('commissionsettings.usermanagement', {
                url: '/usermanagement',
                views: {
                    'content@commissionsettings': {
                        templateUrl: 'template/settings',
                        controller: 'settingsCtrl'
                    }
                }
            })


    }]).service('authInterceptor', function($q, $rootScope) {
        var service = this;

        service.responseError = function(response) {
            // console.log(response)
            if (response.status == 401) {
                $rootScope.logout();
            }
            return $q.reject(response);
        };
    }).config(['$httpProvider', function($httpProvider) {
        $httpProvider.interceptors.push('authInterceptor');
    }]).factory('menu', [
        '$location',
        '$rootScope',
        function($location) {

            var sections = [];
            sections.push({
                name: 'Building Setting',
                type: 'toggle',
                pages: [{
                    name: 'Building',
                    type: 'link',
                    state: 'commissionsettings.building',
                    icon: 'fa fa-map-marker'

                }]
            });
            sections.push({
                name: 'Space',
                type: 'toggle',
                pages: [
                    // {
                    //     name: 'Building',
                    //     type: 'link',
                    //     state: 'commissionsettings.building',
                    //     icon: 'fa fa-map-marker'

                    // }, 
                    {
                        name: 'Seat Type Details',
                        type: 'link',
                        state: 'commissionsettings.seattype',
                        icon: 'fa fa-map-marker'

                    }, {
                        name: 'Seat Mapping',
                        state: 'commissionsettings.seatmapping',
                        type: 'link',
                        icon: 'fa fa-map-marker'

                    },
                    {
                        name: 'BU Mapping',
                        state: 'commissionsettings.bumapping',
                        type: 'link',
                        icon: 'fa fa-map-marker'
                    },
                    {
                        name: 'Employee Details',
                        state: 'commissionsettings.employee',
                        type: 'link',
                        icon: 'fa fa-map-marker'
                    },
                    {
                        name: 'Host Mapping',
                        state: 'commissionsettings.hostmapping',
                        type: 'link',
                        icon: 'fa fa-map-marker'
                    },
                    {
                        name: 'Repo Setting',
                        state: 'commissionsettings.reposettings',
                        type: 'link',
                        icon: 'fa fa-map-marker'
                    }
                ]
            });

            sections.push({
                name: 'Light Details',
                type: 'toggle',
                pages: [
                    // {
                    //     name: 'Sensor Settings',
                    //     type: 'link',
                    //     state: 'commission.sensor',
                    //     icon: 'fa fa-map-marker'
                    // },
                    {
                        name: 'Light Type Creation',
                        type: 'link',
                        state: 'commissionsettings.lighttype',
                        icon: 'fa fa-map-marker'
                    },
                    // {
                    //     name: 'Light Mapping',
                    //     state: 'commissionsettings.lightmapping',
                    //     type: 'link',
                    //     icon: 'fa fa-map-marker'
                    // },
                    {
                        name: 'Device Creation',
                        state: 'commissionsettings.lightdevicecreate',
                        type: 'link',
                        icon: 'fa fa-map-marker'
                    }, {
                        name: 'Address Mapping',
                        state: 'commissionsettings.lightaddressmap',
                        type: 'link',
                        icon: 'fa fa-map-marker'
                    },
                    //  {
                    //     name: 'Light - LAD Mapping',
                    //     state: 'commissionsettings.lightblemapping',
                    //     type: 'link',
                    //     icon: 'fa fa-map-marker'
                    // },
                    {
                        name: 'Light - Sensor Mapping',
                        state: 'commissionsettings.lightsensormapping',
                        type: 'link',
                        icon: 'fa fa-map-marker'
                    },
                    {
                        name: 'Light-Touch Panel Mapping',
                        state: 'commissionsettings.lighttouchpanelmapping',
                        type: 'link',
                        icon: 'fa fa-map-marker'
                    },
                    {
                        name: 'Tunable light',
                        state: 'commissionsettings.sendCommand',
                        type: 'link',
                        icon: 'fa fa-map-marker'
                    },
                    {
                        name: 'Device To Host Mapping',
                        type: 'link',
                        state: 'commissionsettings.lighthostmapping',
                        icon: 'fa fa-map-marker'
                    }, {
                        name: 'Grouping/Scene/Schedule',
                        state: 'commissionsettings.gss_settings',
                        type: 'link',
                        icon: 'fa fa-map-marker'
                    }, {
                        name: 'Send Devices to Host',
                        state: 'commissionsettings.lightconfdwnld',
                        type: 'link',
                        icon: 'fa fa-map-marker'
                    }, {
                        name: 'Commission Devices',
                        state: 'commissionsettings.commissiondaylight',
                        type: 'link',
                        icon: 'fa fa-map-marker'
                    }
                    // }, {
                    //     name: 'Send Command',
                    //     state: 'commissionsettings.sendCommand',
                    //     type: 'link',
                    //     icon: 'fa fa-map-marker'
                    // }
                ]
            });
            sections.push({
                name: 'User Management',
                type: 'toggle',
                pages: [{
                    name: 'User Settings',
                    state: 'commissionsettings.usermanagement',
                    icon: 'fa fa-map-marker'

                }]
            })

            var self;

            return self = {
                sections: sections,

                toggleSelectSection: function(section) {
                    self.openedSection = (self.openedSection === section ? null : section);
                },
                isSectionSelected: function(section) {
                    if (section) {
                        return self.openedSection === section;
                    } else {
                        return false;
                    }
                },

                selectPage: function(section, page) {
                    page && page.url && $location.path(page.url);
                    self.currentSection = section;
                    self.currentPage = page;
                }
            };

            function sortByHumanName(a, b) {
                return (a.humanName < b.humanName) ? -1 :
                    (a.humanName > b.humanName) ? 1 : 0;
            }

        }
    ]).run(['$templateCache', function($templateCache) {
        //ng-init="section.name ==\'Space\' ? toggle()"
        //||  $state.includes(\'commissionsettings\
        $templateCache.put('partials/menu-toggle.tmpl.html',

            '<md-button class="md-button-toggle"\n' +
            '   ng-click="toggle()"\n' +
            '   ng-class="{\'buttonactive\' : isOpen(),\'buttoninactive\' : !isOpen()}"\n' +
            '  aria-controls="docs-menu-{{section.name | nospace}}"\n' +
            '  flex layout="row"\n' +
            '  aria-expanded="{{isOpen()}}">\n' +
            '  <i aria-hidden="true"  class="pull-left settingssidebar"\n' +
            '  ></i>\n' +
            '  {{section.name}}\n' +
            '  <span aria-hidden="true" class=" pull-right  md-toggle-icon" ng-if="section.state !=\'commission.usermanagement\'"\n' +
            '  ng-class="{\'toggled fa fa-chevron-down\' : isOpen(),\'toggled fa fa-chevron-left\' : !isOpen()}"></span>\n' +
            '</md-button>\n' +
            '<ul ng-show="isOpen()" id="docs-menu-{{section.name | nospace}}" class="menu-toggle-list" style="background-color:#212222; overflow-y:scroll"> \n' +
            '  <li ng-repeat="page in section.pages">\n' +
            '    <menu-link section="page"></menu-link>\n' +
            '  </li>\n' +
            '</ul>\n' +
            '');
    }]).directive("limitToMax", function() {
        return {
            link: function(scope, element, attributes) {
                element.on("keydown keyup", function(e) {
                    if (Number(element.val()) > Number(attributes.max) &&
                        e.keyCode != 46 // delete
                        &&
                        e.keyCode != 8 // backspace
                    ) {
                        e.preventDefault();
                        element.val(attributes.max);


                        scope.styobj.width = attributes.max;
                        scope.styobj.height = attributes.max;
                        console.log(scope.styobj);
                        alert('Max size is ' + attributes.max);


                    }
                });
            }
        };
    }).directive("limitToMaxLight", function() {
        return {
            link: function(scope, element, attributes) {
                element.on("keydown keyup", function(e) {
                    if (Number(element.val()) > Number(attributes.max) &&
                        e.keyCode != 46 // delete
                        &&
                        e.keyCode != 8 // backspace
                    ) {
                        e.preventDefault();
                        element.val(attributes.max);


                        scope.styobj.height = scope.selected.height;
                        scope.styobj.width = scope.selected.width;

                        alert('Max width is ' + scope.selected.width + ' & Max height is ' + scope.selected.height);

                    }
                });
            }
        };
    }).directive('menuToggle', ['$timeout', function($timeout) {

        return {
            scope: {
                section: '='
            },
            templateUrl: 'partials/menu-toggle.tmpl.html',
            link: function(scope, element) {
                var controller = element.parent().controller();

                scope.isOpen = function() {
                    return controller.isOpen(scope.section);
                };
                scope.toggle = function() {
                    controller.toggleOpen(scope.section);
                };

                var parentNode = element[0].parentNode.parentNode.parentNode;
                if (parentNode.classList.contains('parent-list-item')) {
                    var heading = parentNode.querySelector('h2');
                    element[0].firstChild.setAttribute('aria-describedby', heading.id);
                }
            }
        };
    }]).run(['$templateCache', function($templateCache) {
        //ng-class="{\'{{section.icon}}\' : true}"
        $templateCache.put('partials/menu-link.tmpl.html',
            '<md-button class="submenuitems"  ui-sref-active="subactive" \n' +
            '  ui-sref="{{section.state}}" ng-click="focusSection()">\n' +
            '  {{section | humanizeDoc}}\n' +
            '  <span  class="md-visually-hidden "\n' +
            '    ng-if="isSelected()">\n' +
            '    current page\n' +
            '  </span>\n' +
            '</md-button>\n' +
            /*  '<hr style="overflow: hidden; border-style: inset;border-width: 0.5px;margin:0px 0px 0px 10%; border-color:lightgrey">\n' + */
            '');
        // style="margin-top:0px;border:solid;border-top:0px;"
    }])
    .directive('menuLink', function() {

        return {
            scope: {
                section: '='
            },
            templateUrl: 'partials/menu-link.tmpl.html',
            link: function($scope, $element) {
                var controller = $element.parent().controller();

                $scope.focusSection = function() {
                    // set flag to be used later when
                    // $locationChangeSuccess calls openPage()
                    controller.autoFocusContent = true;
                };
            }
        };
    }).filter('nospace', function() {
        return function(value) {
            return (!value) ? '' : value.replace(/ /g, '');
        };
    })
    //replace uppercase to regular case
    .filter('humanizeDoc', function() {
        return function(doc) {
            if (!doc) return;
            if (doc.type === 'directive') {
                return doc.name.replace(/([A-Z])/g, function($1) {
                    return '-' + $1.toLowerCase();
                });
            }

            return doc.label || doc.name;
        };
    });

app.run(function($rootScope, $cookies, $state, $http, $mdSidenav, $mdToast, $mdDateRangePicker) {

    $rootScope.showToast = function(message, theme, position) {
        if (!position)
            position = 'top center';
        $mdToast.show(
            $mdToast.simple()
            .textContent(message)
            .position(position)
            .parent('#toastContainer')
            .theme(theme)
            .hideDelay(3000)
        );
    }

    $rootScope.invalidRequest = function() {
        $rootScope.showToast("Please login again", 'error-toast');
        $rootScope.logout();
    }

    $rootScope.toggleLeft = function() {
        $mdSidenav('left').toggle();
    };

    $rootScope.logout = function() {
        $rootScope.auth_token = null;
        $cookies.remove('auth_token');
        $cookies.remove('user');
        $state.go('login')
    }
    $rootScope.name = "";
    $rootScope.auth_token = $cookies.get("auth_token");

    $rootScope.userContent = function() {
        var user = $cookies.getObject("user");
        $rootScope.name = user.name;
        $rootScope.userId = user.userId;
    }


    if ($rootScope.auth_token) {

        var expireTime = JSON.parse(atob($rootScope.auth_token.split('.')[1])).exp;
        var currentTime = new Date().getTime() / 1000 | 0;

        if (expireTime < currentTime)
            $rootScope.logout();
        else {
            $rootScope.userContent();
        }

    }

    function buildToggler(componentId) {
        return function() {
            $mdSidenav(componentId).toggle();
        };
    }

    function googleTranslateElementInit() {
        new google.translate.TranslateElement({ pageLanguage: 'en' }, 'google_translate_element');
    }

    $rootScope.showcmpbtn = false;
    $rootScope.comparebid = [];

    $rootScope.compareitems = function(eachbid) {
        if (eachbid.val == true) {
            $rootScope.comparebid.push(eachbid.bldgId);

        } else {
            $rootScope.comparebid.pop(eachbid.bldgId);
        }

        if ($rootScope.comparebid.length > 1) {
            $rootScope.showcmpbtn = true;
            console.log("true!!");
        } else {
            $rootScope.showcmpbtn = false;
        }
        $rootScope.count = $rootScope.comparebid.length;
    }

});