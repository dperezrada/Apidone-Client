
var APIdone = {
    Models: {},
    Collections: {},
    Views: {},
    Templates:{},
    Variables: {},
    Events: {},
    Instances: {
        Views: {}
    }
}
// var base_url = "http://demo.apidone.com/buxus";

APIdone.Models.Resource = Backbone.Model.extend({
    initialize: function(options) {
        this.url = options.url;
    }
});

APIdone.Collections.GenericCollection = Backbone.Collection.extend({
    initialize: function(options) {
        // this.url = base_url+options.url;
        this.url = options.url;
    }
});

APIdone.Views.Child = Backbone.View.extend({
    tagName: 'li',
    template: _.template($('#tmplt-child').html()),
    render: function() {
        $(this.el).append(this.template(this.model.toJSON()));
        return this;
    }

});

APIdone.Views.ResourcesSingle = Backbone.View.extend({
    tagName: 'li',
    template: _.template($('#tmplt-resource-single').html()),
    events: {
        'click': 'mark_as_active'
    },
    render: function() {
        var posible_tags = ['name', 'title', 'id'];
        for (var i = 0; i < posible_tags.length; i++) {
            console.log(this.model.get(posible_tags[i]));
            if(this.model.get(posible_tags[i])){
                this.model.set({__show_value: this.model.get(posible_tags[i])});
                break;
            }
        }
        $(this.el).attr('data-id', this.model.get('id'));
        if (APIdone.Variables.resource_id == this.model.get('id')) {
            this.mark_as_active();
            APIdone.Childs = new APIdone.Collections.GenericCollection({url: APIdone.Variables.resource_path+"/__resources"})
            new APIdone.Views.Childs({url: APIdone.Variables.resource_path, data: APIdone.Childs});            
        }
        $(this.el).append(this.template(this.model.toJSON()));
        return this;
    },
    mark_as_active: function(){
        $("#resources li").removeClass("active");
        $(this.el).addClass("active");
    }

});

APIdone.Views.Childs = Backbone.View.extend({
    el: $("#mainContainer"),
    childs: [],
    current_url: '',
    initialize: function (options) {
        if(options){
            if(options.is_base) this.is_base = true;
            if(options.url) this.current_url = options.url.replace('/__resources', '');
            if(options.data){
                this.childs = options.data;
                this.childs.bind('reset',this.render, this)
                this.childs.bind('add',this.render, this)
                this.childs.fetch();
            }
        }
    },

    render: function () {
        var self = this;
        $(".childs").html("");
        $("#childs").html("");
        _.each(this.childs.models,function(model){
            model.set({current_url: self.current_url});
            var res = new APIdone.Views.Child({model: model});
            if (self.is_base) {
                $("#childs").append(res.render().el);    
            } else {
                $("#resources li.active .childs").append(res.render().el);    
            }
            
        });
    },
});

APIdone.Views.Resources = Backbone.View.extend({
    el: $("#mainContainer"),
    resources: [],
    current_url: '',
    initialize: function (options) {
        if(options){
            if(options.url) this.current_url = options.url.replace('/__resources', '');
            if(options.data){
                this.resources = options.data;
                this.resources.bind('reset',this.render, this)
                this.resources.bind('add',this.render, this)
                this.resources.fetch();
            }
        }
    },

    render: function () {
        var self = this;
        $("#resources").html("");
        $("#resource_content").html("");
        _.each(this.resources.models,function(model){
            model.set({__url: model.url()});
            var res = new APIdone.Views.ResourcesSingle({model: model});
            $("#resources").append(res.render().el);
        });
    },
});

APIdone.Views.ResourceDetail = Backbone.View.extend({
    el: $("#mainContainer"),
    resource: [],
    current_url: '',
    initialize: function (options) {
        if(options){
            if(options.url) this.current_url = options.url;
            if(options.data){
                this.resource = options.data;
                this.resource.bind('change',this.render, this);
                this.resource.fetch();
            }
        }
    },

    render: function () {
        var self = this;
        $("#resource_content").html("");
        _.each(this.resource.attributes ,function(value, key){
            if(key == "url" && self.resource.url == value){

            }else{
                var value_edited = value;
                if(self._check_if_image(value)){
                    value_edited = "<img src='"+value+"'/>";
                }else if(self._check_if_link(value)){
                    value_edited = "<a href='"+value+"' target='blank_'>"+value+"</a>";
                }
                $("#resource_content").append("<li><span class='key'>"+key+"</span>: <span>"+value_edited+"</span></li>");
            }
        });
    },
    _check_if_link: function(text){
        var url_expression = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
        var url_regex = new RegExp(url_expression);
        return text.match(url_regex);
    },
    _check_if_image: function(text){
        var image_expression = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?\.(?:jpg|gif|png)(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
        var image_regex = new RegExp(image_expression);
        return text.match(image_regex);
    },
});

APIdone.Views.Main = Backbone.View.extend({
    el: $("#container"),
    events: {
        "click #new_resource_container a": "new_resource_popup"
    },
    initialize: function () {
    },
    new_resource_popup: function(e) {
        e.preventDefault();
        APIdone.Instances.Views.new_resource = new APIdone.Views.NewResource();
        $("#resource_content").html(APIdone.Instances.Views.new_resource.render().el);
    }
});

APIdone.Views.NewResource = Backbone.View.extend({
    tagName: "div",
    template: _.template($('#tmplt-resource-new').html()),
    events: {
        'click button': "create_resource"
    },
    initialize: function () {

    },
    render: function(){
        $(this.el).html(this.template);
        return this;
    },
    create_resource: function(){
        var new_resource = JSON.parse($('textarea',this.el).val());
        APIdone.Resources.create(new_resource);
    }
});

APIdone.Views.Path = Backbone.View.extend({
    el: $("#headers .title"),
    initialize: function () {
        this.render();
    },
    render: function () {
        var splitted_url = appRouter.path.split('/');
        var html = "";
        var current_url = '#';
        for (var i = 0; i<splitted_url.length; i++) {
            if(!splitted_url[i]) continue;
            current_url +='/'+splitted_url[i];
            html += " / <a href='"+current_url+"'>"+splitted_url[i]+"</a>";
        };
        this.el.html(html);
    }
});


APIdone.Router = Backbone.Router.extend({
    routes: {
        "*route": "defaultRoute" 
    },

    defaultRoute: function (path) { 
        var type;
        var splitted_path = path.split('/');
        if(!path){
            // Base
            APIdone.Variables.resources = "";
            APIdone.Variables.resource_id = "";

            APIdone.Childs = new APIdone.Collections.GenericCollection({url: "/__resources"})
            new APIdone.Views.Childs({url: path, data: APIdone.Childs, is_base: true});

            $("#base_resources_modal").modal();
            $("#base_resources_modal").click(
                function(){
                    $("#base_resources_modal").modal('hide');
                }
            );
            

        }else if(splitted_path.length%2 - 1 == 0){
            console.log("caso recurso");
            type = "resource_detail";

            var resource_id = splitted_path.splice(splitted_path.length-1,1);

            APIdone.Variables.resources_path = splitted_path.join('/');
            APIdone.Variables.resource_path = path;
            APIdone.Variables.resource_id = resource_id;
            $('#resources').html("");
            this.load_resources(APIdone.Variables.resources_path);

            APIdone.ResourceDetail = new APIdone.Models.Resource({url: APIdone.Variables.resource_path});
            new APIdone.Views.ResourceDetail({url: APIdone.Variables.resource_path, data: APIdone.ResourceDetail});

        }else{

            APIdone.Variables.resources = splitted_path.join('/');
            APIdone.Variables.resource_id = "";

            type = "resources";
            this.load_resources(path);
        }
        this.path = path.replace('__resources', '');
        new APIdone.Views.Path();
    },
    load_resources: function(path){
        var splitted_url = path.split('/');
        $("#title_resources").html(splitted_url[splitted_url.length-1]);
        APIdone.Resources = new APIdone.Collections.GenericCollection({url: path})
        new APIdone.Views.Resources({url: path, data: APIdone.Resources});
    }
});

var appRouter = new APIdone.Router();
Backbone.history.start();
APIdone.Instances.Views.Main = new APIdone.Views.Main();