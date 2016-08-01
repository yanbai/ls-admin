angular.module("foodCourt.Service", []);
angular
    .module("foodCourt.Service")
    .factory("orderedMenuService", function() {
        var service = {
            orderedMenu: [],
            orderedMenuId: [],
            getAllMenu: function() {
                return this.orderedMenu
            },

            getMenuById: function(food_id) {
                var selectedMenu = this.orderedMenu.filter(function(item) {
                    return item._id == food_id;
                })
                return selectedMenu[0];
            },

            setMenu: function(array_menu) {
                this.orderedMenu = array_menu;
            },

            addMenu: function(object_food) {
                if (this.haveThisMenu(object_food._id)) {
                    this.getMenuById(object_food._id).number++;
                } else {
                    this.orderedMenu.push(object_food);
                    this.getMenuById(object_food._id).number = 1;
                    this.orderedMenuId.push(object_food._id);
                }
            },

            haveThisMenu: function(food_id) {
                return this.orderedMenuId.indexOf(food_id) > -1;
            },

            getTotalPrice: function(){
                var totalPrice = 0;
                this.orderedMenu.forEach(function(item){
                    totalPrice+=item.now_price*item.number;
                })
                return totalPrice;
            },

            clear: function() {
                this.orderedMenu = [];
                this.orderedMenuId = [];
            }
        }
        return service
    })

angular.module("foodCourt.Directive", ["foodCourt.Service"]);
angular
    .module("foodCourt.Directive")
    .controller("cartController", ["$scope", function($scope){
        $scope.totalPrice = {value:0};
    }])
    .directive("cartDirective", function(){
        return {
            template:`<div class="panel panel-default shopping-cart" ng-controller="cartController">
                <div class="panel-heading">
                    <h3 class="panel-title">购物车</h3>
                </div>
                <div class="panel-body">
                    <div ng-repeat="food in carts" class="row">
                        <div class="col-md-4">
                            <span>{{food.name}}</span>
                        </div>
                        <div class="col-md-4">
                            <number-calculater-directive></number-calculater-directive>
                        </div>
                        <div class="col-md-4">
                            {{food.now_price}}
                        </div>
                    </div>
                </div>
                <div class="panel-footer">
                    <div class="row">
                        <div class="col-md-6">
                            <a class="btn btn-default" href="#/cart/checkout">去结算</a>
                        </div>
                        <div class="col-md-6">
                            ￥{{totalPrice.value}}
                            <a href=""></a>
                        </div>
                    </div>
                </div>
            </div>`
        }
    })
    .controller("numberCalculaterController", ["$scope", "orderedMenuService", function($scope, orderedMenu){
        $scope.minus = function(food, e) {
            food.number--;
            orderedMenu.setMenu($scope.carts);
        }
        $scope.add = function(food, e) {
            food.number++;
            orderedMenu.setMenu($scope.carts);
        }

        $scope.$watch('carts', function(newValue, oldValue) {
            $scope.totalPrice.value = 0;
            angular.forEach(newValue, function(item, key) {
                $scope.totalPrice.value += item.number*item.now_price;
                // if(item.quantity < 1) {
                //     var returnKey = confirm('是否从购物车内删除该产品');  
                //     if(returnKey) {  
                //         // $scope.remove(item.id);  
                //     }else{  

                //         // item.quantity = oldValue[key].quantity;  
                //     }  
                //     return ;  
                // }  
            });  
            console.log($scope.totalPrice);
        }, true); ////检查被监控的对象的每个属性是否发生变化  

    }])
    .directive("numberCalculaterDirective", function(){
        return {
            template: `
                <div class="input-group" ng-controller="numberCalculaterController">
                    <span class="input-group-btn">
                        <button ng-click="minus(food, $event, $index)" class="btn btn-default" type="button"><span class="glyphicon glyphicon-minus" aria-hidden="true"></span></button> 
                    </span>
                    <input  type="text" class="form-control" ng-model="food.number" placeholder="">
                    <span class="input-group-btn"> 
                        <button ng-click="add(food, $event, $index)" class="btn btn-default" type="button"><span class="glyphicon glyphicon-plus" aria-hidden="true"></span></button> 
                    </span>
                </div>
            `
        }
    })


var foodcourtController = angular.module('foodcourtController', ["foodCourt.Directive", "foodCourt.Service"]);


foodcourtController.controller('foodMenuCtrl', ["$scope", "$http", "orderedMenuService", function($scope, $http, orderedMenu) {
    $http.get("/get_all_menu").success(function(data) {
        var type_lists = [];
        var menu_by_type = [];
        data.forEach(function(item) {
            if (type_lists.indexOf(item['type']) > -1) {
                menu_by_type.forEach(function(type_menu) {
                    if (type_menu.type == item.type) {
                        type_menu.data.push(item)
                    }
                })
            } else {
                type_lists.push(item['type']);
                menu_by_type.push({
                    type: item['type'],
                    data: []
                })
                menu_by_type[menu_by_type.length - 1].data.push(item);
            }
        })
        $scope.menu_by_type = menu_by_type;
        $scope.menus = data;
    });

    $scope.carts = [];
    orderedMenu.clear();

    function show_food_in_cart(food) {
        if($scope.carts.some(function(ele){return ele._id == food._id})){
        }else{
            $scope.carts.push(food);
        }
        orderedMenu.addMenu(food);
    }

    $scope.addCart = function(food_id, event) {
        this.menus.forEach(function(item) {
            if (item._id == food_id) {
                show_food_in_cart(item)
            }
        })
        event.preventDefault();
    };
}])


foodcourtController.controller('checkoutCtrl', ["$scope", "orderedMenuService", function($scope, orderedMenu) {
    $scope.carts = orderedMenu.orderedMenu;
    $scope.totalPrice = {value: 0};
}])
