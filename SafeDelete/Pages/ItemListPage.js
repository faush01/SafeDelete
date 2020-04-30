define(['mainTabsManager'], function (mainTabsManager) {
    'use strict';

    var navigation_links_list = [];
    var current_parent_id = "";
    var current_type = "";

    function getTabs() {
        var tabs = [
            {
                href: Dashboard.getConfigurationPageUrl('ItemListPage'),
                name: 'Safe Delete'
            },
            {
                href: Dashboard.getConfigurationPageUrl('ActivityListPage'),
                name: 'Activity'
            },
            {
                href: Dashboard.getConfigurationPageUrl('SettingsPage'),
                name: 'Settings'
            }
        ];
        return tabs;
    }

    ApiClient.getItemListForDelete = function (url_to_get) {
        console.log("getItemListForDelete Url = " + url_to_get);
        return this.ajax({
            type: "GET",
            url: url_to_get,
            dataType: "json"
        });
    };

    ApiClient.deleteItemConfirmation = function (url_to_get) {
        console.log("deleteItemConfirmation Url = " + url_to_get);
        return this.ajax({
            type: "GET",
            url: url_to_get,
            dataType: "json"
        });
    };

    ApiClient.sendDeleteActionPost = function (url_to_get, query_data) {
        var post_data = JSON.stringify(query_data);
        console.log("sendDeleteActionPost url  = " + url_to_get);
        console.log("sendDeleteActionPost data = " + post_data);
        return this.ajax({
            type: "POST",
            url: url_to_get,
            dataType: "json",
            data: post_data,
            contentType: 'application/json'
        });
    };

    function to_size_text(size_in_bytes) {
        if (size_in_bytes > (1024 * 1024 * 1024)) {
            var gig = (size_in_bytes / (1024 * 1024 * 1024));
            gig = Math.round(gig * 10) / 10;
            return gig + " GB";
        }
        else if (size_in_bytes > (1024 * 1024)) {
            var meg = (size_in_bytes / (1024 * 1024));
            meg = Math.round(meg * 10) / 10;
            return meg + " MB";
        }
        else if (size_in_bytes > 1024) {
            var kilo = (size_in_bytes / 1024);
            kilo = Math.round(kilo * 10) / 10;
            return kilo + " KB";
        }
        else {
            return size_in_bytes + " B";
        }
    }

    function delete_item(view, item_id) {

        var delete_url = "/emby_safe_delete/delete_item/" + item_id + "?stamp=" + new Date().getTime();
        delete_url = ApiClient.getUrl(delete_url);

        ApiClient.deleteItemConfirmation(delete_url).then(function (delete_result) {
            console.log("Delete Result: " + JSON.stringify(delete_result));

            // delete confirmation message
            var confirm_text = "You are about to delete the following files:<br/><br/>";
            confirm_text += "<div style='width:100%;'><table style='margin-left:auto; margin-right:auto;'>";
            for (var index = 0; index < delete_result.file_list.length; index++) {
                confirm_text += "<tr><td style='text-align: left; white-space: nowrap;'>" + delete_result.file_list[index].Key + " </td>";
                confirm_text += "<td style='text-align: left; white-space: nowrap;'>(" + to_size_text(delete_result.file_list[index].Value) + ")</td></tr>";
            }
            confirm_text += "</table></div><br/>Are you sure?";

            var confirmation_message_text = view.querySelector('#confirmation_message_text');
            confirmation_message_text.innerHTML = confirm_text;

            var button_class_high = "btnOption raised formDialogFooterItem formDialogFooterItem-autosize button-submit emby-button";
            var button_class_low = "btnOption raised formDialogFooterItem formDialogFooterItem-autosize button-cancel emby-button";

            var confirmatiom_dialog = view.querySelector('#confirmatiom_dialog');

            // button container
            var button_contrainer = view.querySelector('#button_contrainer');
            // remove old buttons
            while (button_contrainer.firstChild) {
                button_contrainer.removeChild(button_contrainer.firstChild);
            }

            // add yes button
            var yes_button = document.createElement("button");
            yes_button.className = button_class_high;
            yes_button.setAttribute("is", "emby-button");
            yes_button.style.paddingLeft = "30px";
            yes_button.style.paddingRight = "30px";
            yes_button.style.marginLeft = "20px";
            yes_button.style.marginRight = "20px";
            var t = document.createTextNode("Yes");
            yes_button.appendChild(t);

            yes_button.addEventListener("click", function () {
                confirmatiom_dialog.style.visibility = "hidden";
                var delete_url_post = "/emby_safe_delete/delete_item_action?stamp=" + new Date().getTime();
                delete_url_post = ApiClient.getUrl(delete_url_post);

                var query_data = {
                    action_token: delete_result.action_token,
                    item_id: item_id
                };

                ApiClient.sendDeleteActionPost(delete_url_post, query_data).then(function (result) {

                    alert("Delete action\r\nResult: " + result.result + "\r\n" + result.message);

                });
            });

            button_contrainer.appendChild(yes_button);

            // add no button
            var no_button = document.createElement("button");
            no_button.className = button_class_high;
            no_button.setAttribute("is", "emby-button");
            no_button.style.paddingLeft = "30px";
            no_button.style.paddingRight = "30px";
            no_button.style.marginLeft = "20px";
            no_button.style.marginRight = "20px";
            t = document.createTextNode("No");
            no_button.appendChild(t);

            no_button.addEventListener("click", function () {
                confirmatiom_dialog.style.visibility = "hidden";
            });

            button_contrainer.appendChild(no_button);


            // set dialog visible
            confirmatiom_dialog.style.visibility = "visible";



            /*
            var confirm_text = "You are about to delete the following files:<br/><br/>";
            confirm_text += "<div style='width:100%;'><table style='margin-left:auto; margin-right:auto;'>";
            for (var index = 0; index < delete_result.file_list.length; index++) {
                confirm_text += "<tr><td style='text-align: left; white-space: nowrap;'>" + delete_result.file_list[index].Key + " </td><td style='text-align: left; white-space: nowrap;'>(" + to_size_text(delete_result.file_list[index].Value) + ")</td></tr>";
            }
            confirm_text += "</table></div><br/>Are you sure?";

            
            require(['dialog'], function (dialog) {
                var buttons = [];

                buttons.push({
                    name: "Yes",
                    id: 'yes',
                    type: 'submit'
                });

                buttons.push({
                    name: "No",
                    id: 'no',
                    type: 'submit'
                });

                dialog({
                    title: "Confirm Delete Action",
                    //text: confirm_text,
                    html: confirm_text,
                    buttons: buttons

                }).then(function (dialog_result) {

                    if (dialog_result === 'yes') {
                        var delete_url_post = "/emby_safe_delete/delete_item_action?stamp=" + new Date().getTime();
                        delete_url_post = ApiClient.getUrl(delete_url_post);

                        var query_data = {
                            action_token: delete_result.action_token,
                            item_id: item_id
                        };

                        ApiClient.sendDeleteActionPost(delete_url_post, query_data).then(function (result) {

                            alert("Delete action\r\nResult: " + result.result + "\r\n" + result.message);

                        });
                    }

                });
            });
            */



            /*
            var confirm_text = "You are about to delete the following item.\r\n\r\n";

            confirm_text += "Item Details\r\n\r\n";
            confirm_text += "Type: " + delete_result.item_info["Item_type"] + "\r\n";

            if (delete_result.item_info["Item_type"] === "Series") {
                confirm_text += "Series: " + delete_result.item_info["item_name"] + "\r\n";
            }
            else if (delete_result.item_info["Item_type"] === "Season") {
                confirm_text += "Series: " + delete_result.item_info["series_name"] + "\r\n";
                confirm_text += "Season: " + delete_result.item_info["season_number"] + "\r\n";
            }
            else if (delete_result.item_info["Item_type"] === "Episode") {
                confirm_text += "Series: " + delete_result.item_info["series_name"] + "\r\n";
                confirm_text += "Season: " + delete_result.item_info["season_number"] + "\r\n";
                confirm_text += "Episode: " + delete_result.item_info["episode_number"] + "\r\n";
            }
            else {
                confirm_text += "Name: " + delete_result.item_info["item_name"] + "\r\n";
            }

            confirm_text += "\r\nItem Files\r\n\r\n";
            for (var index = 0; index < delete_result.file_list.length; index++) {
                confirm_text += " - " + delete_result.file_list[index].Key + " (" + to_size_text(delete_result.file_list[index].Value) + ")\r\n";
            }
            confirm_text += "\r\nAre you sure?\r\n\r\n";

            var conf = confirm(confirm_text);

            if (conf) {

                var delete_url_post = "/emby_safe_delete/delete_item_action?stamp=" + new Date().getTime();
                delete_url_post = ApiClient.getUrl(delete_url_post);

                var query_data = {
                    action_token: delete_result.action_token,
                    item_id: item_id
                };

                ApiClient.sendDeleteActionPost(delete_url_post, query_data).then(function (result) {
                    if (result.result) {
                        alert(result.message);
                    }
                    else {
                        alert("Error processing files!\r\n\r\n" + result.message);
                    }
                });
            }
            */

        });
    }

    function show_items(view, type, parent_id, parent_name) {

        if (parent_id !== null) {
            current_parent_id = parent_id;
        }
        if (type !== null) {
            current_type = type;
        }

        if (!current_type) {
            return;
        }

        var sort_by_selection = view.querySelector('#sort_by_selection');
        var sort_action = sort_by_selection.options[sort_by_selection.selectedIndex].value;

        var url_to_get = "/emby_safe_delete/list_items?parent_id=" + current_parent_id + "&item_type=" + current_type + "&sort_by=" + sort_action + "&stamp=" + new Date().getTime();
        url_to_get = ApiClient.getUrl(url_to_get);

        ApiClient.getItemListForDelete(url_to_get).then(function (items_list_data) {
            //alert("Loaded Data: " + JSON.stringify(usage_data));
            populate_items_listreport(view, items_list_data);
        });

        var last_link = navigation_links_list[navigation_links_list.length - 1];

        console.log("last_link name:" + last_link.name + " type:" + last_link.type + " parent_id:" + last_link.parent);
        console.log("parent:" + parent_id + " type:" + type + " parent_name:" + parent_name);

        if (last_link.parent !== parent_id || last_link.type !== type) {
            var link_item = { name: parent_name, parent: parent_id, type: type };
            navigation_links_list.push(link_item);
            update_navigation_links(view);
        }

    }

    function populate_items_listreport(view, item_list_data) {

        console.log(JSON.stringify(item_list_data));

        var table_body = view.querySelector('#item_list_rows');

        while (table_body.firstChild) {
            table_body.removeChild(table_body.firstChild);
        }

        item_list_data.forEach(function (item_details, index) {

            var tr = document.createElement("tr");
            tr.className = "detailTableBodyRow detailTableBodyRow-shaded";

            var td = null;
            var i = null;
            var t = null;
            var span = null;

            // action button
            td = document.createElement("td");
            td.style = "text-align: center;";
            span = document.createElement("span");
            i = document.createElement("i");
            i.className = "md-icon";
            i.style = "font-size: large;cursor: pointer;";
            t = document.createTextNode("delete");
            i.appendChild(t);
            span.appendChild(i);
            span.setAttribute("title", "Delete");
            span.addEventListener("click", function () { delete_item(view, item_details.id); });
            td.appendChild(span);
            tr.appendChild(td);

            // watched icon
            td = document.createElement("td");
            td.style = "text-align: center;";
            if (item_details.played) {
                span = document.createElement("span");
                i = document.createElement("i");
                i.style = "font-size: large;";
                i.className = "md-icon";
                i.appendChild(document.createTextNode("check_circle"));
                span.appendChild(i);
                td.appendChild(span);
            }
            tr.appendChild(td);

            // name of item
            td = document.createElement("td");
            td.style = "white-space: nowrap;width: 100%";
            span = document.createElement("span");
            //span.style = "font-weight: bold;";//"font-size: large; font-weight: bold;";
            var item_name = "NONE";

            if (item_details.type === "Series") {
                item_name = item_details.name;
                span.style.cursor = "pointer";
                span.addEventListener("click", function () { show_items(view, "Season", item_details.id, item_details.name); });
            }
            else if (item_details.type === "Season") {
                item_name = item_details.series_name + " - " + item_details.name;
                span.style.cursor = "pointer";
                span.addEventListener("click", function () { show_items(view, "Episode", item_details.id, item_details.name); });
            }
            else if (item_details.type === "Episode") {
                item_name = item_details.series_name + " - " + item_details.season_name + " - " + item_details.episode_number + " : " + item_details.name;
            }
            else if (item_details.type === "Movie") {
                item_name = item_details.name + " (" + item_details.production_year + ")";
            }

            //item_name += " (" + item_details.parent_id + ")";

            span.innerHTML = item_name;
            span.setAttribute("title", item_details.path);
            td.appendChild(span);
            tr.appendChild(td);

            table_body.appendChild(tr);

        });
    }

    function add_starting_rows(view) {

        var table_body = view.querySelector('#item_list_rows');

        while (table_body.firstChild) {
            table_body.removeChild(table_body.firstChild);
        }

        // add movies root item
        var tr = document.createElement("tr");
        tr.className = "detailTableBodyRow detailTableBodyRow-shaded";

        var td = document.createElement("td");
        td.appendChild(document.createTextNode(""));
        tr.appendChild(td);

        td = document.createElement("td");
        td.appendChild(document.createTextNode(""));
        tr.appendChild(td);

        td = document.createElement("td");
        var span = document.createElement("span");
        //span.style = "font-size: large; font-weight: bold;";
        span.innerHTML = "Movies";
        span.style.cursor = "pointer";
        span.addEventListener("click", function () { show_items(view, "Movie", "", "Movies"); });
        td.appendChild(span);
        tr.appendChild(td);

        table_body.appendChild(tr);

        // add TV Shows root item
        tr = document.createElement("tr");
        tr.className = "detailTableBodyRow detailTableBodyRow-shaded";

        td = document.createElement("td");
        td.appendChild(document.createTextNode(""));
        tr.appendChild(td);

        td = document.createElement("td");
        td.appendChild(document.createTextNode(""));
        tr.appendChild(td);

        td = document.createElement("td");
        span = document.createElement("span");
        //span.style = "font-size: large; font-weight: bold;";
        span.innerHTML = "TV Shows";
        span.style.cursor = "pointer";
        span.addEventListener("click", function () { show_items(view, "Series", "", "TV Shows"); });
        td.appendChild(span);
        tr.appendChild(td);

        table_body.appendChild(tr);

    }

    function navigation_action(view, link_details, index) {

        console.log("link_details name:" + link_details.name + " type:" + link_details.type + " parent_id:" + link_details.parent);
        console.log("index: " + index);

        if (link_details.type === "root") {
            add_starting_rows(view);
        }
        else {
            show_items(view, link_details.type, link_details.parent, link_details.name);
        }

        navigation_links_list.splice(index + 1, navigation_links_list.length);

        update_navigation_links(view);
    }

    function update_navigation_links(view) {

        var navigation_links = view.querySelector('#navivation_links');

        while (navigation_links.firstChild) {
            navigation_links.removeChild(navigation_links.firstChild);
        }

        navigation_links_list.forEach(function (link_details, index) {

            var span = document.createElement("span");
            span.innerHTML = " > " + link_details.name;
            span.style = "font-size: large; cursor: pointer;";

            span.addEventListener("click", function () { navigation_action(view, link_details, index); });

            navigation_links.appendChild(span);
        });

    }

    // /emby_safe_delete/list_items?item_type=Movie
    // /emby_safe_delete/list_items?item_type=Series
    // /emby_safe_delete/list_items?parent_id=6&item_type=Season
    // /emby_safe_delete/list_items?parent_id=7&item_type=Episode

    return function (view, params) {

        view.addEventListener('viewshow', function (e) {
            mainTabsManager.setTabs(this, 0, getTabs);

            var sort_by_selection = view.querySelector('#sort_by_selection');
            sort_by_selection.addEventListener("change", sort_changed);
            
            function sort_changed() {
                show_items(view, null, null, "");
            }

            var root = { name: "Root", parent: "", type: "root" };
            navigation_links_list = [];
            navigation_links_list.push(root);
            update_navigation_links(view);

            add_starting_rows(view);
        });

        view.addEventListener('viewhide', function (e) {

        });

        view.addEventListener('viewdestroy', function (e) {

        });

    };
    
});
