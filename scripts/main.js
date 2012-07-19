
var APIdone = {
    Models: {},
    Collections: {},
    Views: {},
    Templates:{}
}

APIdone.Models.Resource = Backbone.Model.extend({
    initialize: function(options) {
        this.url = options.url;
    }
});

APIdone.Collections.GenericCollection = Backbone.Collection.extend({
    initialize: function(options) {
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
    render: function() {
        $(this.el).append(this.template(this.model.toJSON()));
        return this;
    }

});

APIdone.Views.Childs = Backbone.View.extend({
    el: $("#mainContainer"),
    childs: [],
    current_url: '',
    initialize: function (options) {
        if(options){
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
        _.each(this.childs.models,function(model){
            model.set({current_url: self.current_url});
            var res = new APIdone.Views.Child({model: model});
            $("#childs").append(res.render().el);
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
        _.each(this.resource.attributes ,function(value, key){
            if(key == "url" && self.resource.url == value){

            }else{
                var value_edited = value;
                if(self._check_if_image(value)){
                    value_edited = "<img src='"+value+"'/>";
                }else if(self._check_if_link(value)){
                    value_edited = "<a href='"+value+"' target='blank_'>"+value+"</a>";
                }
                $("#resources").append("<li><span class='key'>"+key+"</span>: <span>"+value_edited+"</span></li>");
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
    el: $("#mainContainer"),
    childs: [],
    resources: [],
    resource: [],
    current_url: '',
    events: {
        "click #childs li a": "load_resources"
    },
    initialize: function (options) {
        if(options && options.childs){
            this.childs = options.childs;
        }
        this.childs.bind('reset',this.render, this)
        this.childs.bind('add',this.render, this)
        this.childs.fetch();
    },

    render: function () {
        var self = this;
        _.each(this.childs.models,function(model){
            model.set({current_url: self.current_url});
            var res = new APIdone.Views.Child({model: model});
            $("#childs").append(res.render().el);
        });
    },
    load_resources: function(ev) {
        var resources_url = $(ev.target).attr('href').replace("#", "");
        this.resources = new APIdone.Collections.GenericCollection({url: resources_url})

        this.resources.bind('reset',this.render_resources, this);
        this.resources.bind('add',this.render_resources, this);
        this.resources.fetch();
    },
    render_resources: function() {
        var self = this;
        _.each(this.resources.models,function(model){
            model.set({__url: model.url()});
            var res = new APIdone.Views.ResourcesSingle({model: model});
            $("#resources").append(res.render().el);
        });
    }
})

APIdone.Router = Backbone.Router.extend({
    routes: {
        "*route": "defaultRoute" 
    },

    defaultRoute: function (path) {
        var type;
        if(!path){
            path = "/__resources";
            type = "childs";
        }else if(path.indexOf("__resources")>0){
            type = "childs";
        }else if(path.split('/').length%2 - 1 == 0){
            type = "resource_detail";
        }else{
            type = "resources";
        }
        

        $("#childs").html("");
        $("#resources").html("");
        
        if(type == 'childs'){
            APIdone.Childs = new APIdone.Collections.GenericCollection({url: path})
            new APIdone.Views.Childs({url: path, data: APIdone.Childs});
        }
        if(type == 'resources'){
            APIdone.Resources = new APIdone.Collections.GenericCollection({url: path})
            new APIdone.Views.Resources({url: path, data: APIdone.Resources});
        }
        if(type == 'resource_detail'){
            APIdone.ResourceDetail = new APIdone.Models.Resource({url: path})
            new APIdone.Views.ResourceDetail({url: path, data: APIdone.ResourceDetail});

            APIdone.Childs = new APIdone.Collections.GenericCollection({url: path+"/__resources"})
            new APIdone.Views.Childs({url: path, data: APIdone.Childs});
        }
    }
});

var appRouter = new APIdone.Router();
Backbone.history.start();