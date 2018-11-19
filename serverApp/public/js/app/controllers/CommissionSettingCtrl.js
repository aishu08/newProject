app.controller("CommissionSettingCtrl", ['$scope', '$rootScope', '$cookies',
    '$log',
    '$state',
    '$timeout',
    '$location',
    'menu',
    '$transitions', '$http',
    function ($scope, $rootScope, $cookies, $log, $state, $timout, $location, menu, $transitions, $http) {


        $scope.pageTitle = "Settings"
        $scope.menu = menu;
        $scope.button=true;
        var vm = this;
        vm.isOpen = isOpen;
        vm.toggleOpen = toggleOpen;
        $scope.isOpen = function (section) {

            if (menu.isSectionSelected(section)) {

                section.class = "active"
            } else {
                if (section) {
                    section.class = ""
                }
            }
            return menu.isSectionSelected(section);
        }

        $rootScope.getstate = function (section) {
            console.log(section);
            console.log($scope.$state);
        }

        $scope.toggleOpen = function (section) {

            menu.toggleSelectSection(section);
        }
        //functions for menu-link and menu-toggle
        $scope.isOpen = $scope.isOpen();
        $scope.toggleOpen = $scope.toggleOpen();
        $scope.autoFocusContent = false;
        $scope.menu = menu;

        $scope.status = {
            isFirstOpen: true,
            isFirstDisabled: false
        };


        /* $scope.focusSection = function (section) {
            console.log(section.name);
            $scope.sectionfocus = section.name;
        }
 */

        $scope.getsection = function () {
            for (var k = 0; k < menu.sections.length; k++) {
                if (menu.sections[k].pages) {
                    for (var i = 0; i < menu.sections[k].pages.length; i++) {

                        if ($state.current.name == "commissionsettings" && menu.sections[k].name == "Bulding Setting") {
                            menu.toggleSelectSection(menu.sections[k])
                            $state.go('commissionsettings.building');
                        } else if (menu.sections[k].pages[i].state == $state.current.name) {

                            menu.toggleSelectSection(menu.sections[k])
                        }
                    }
                }
            }
        }
        $scope.getsection();

        function isOpen(section) {
            if (menu.isSectionSelected(section)) {
                // console.log(section)
                section.class = "active"
            } else {
                section.class = ""
            }
            return menu.isSectionSelected(section);
        }

        function toggleOpen(section) {
            menu.toggleSelectSection(section);
        }




    }])