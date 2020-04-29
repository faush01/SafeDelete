define(['mainTabsManager'], function (mainTabsManager) {
    'use strict';

    var pluginId = "5fde15c6-f70d-4e35-ad38-aaf5aa26bf82";

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

    function setRecyclePathCallBack(selectedDir, view) {
        ApiClient.getPluginConfiguration(pluginId).then(function (config) {

            config.RecycledPath = selectedDir;

            console.log("Config: " + JSON.stringify(config));

            var recycle_path_label = view.querySelector('#recycle_path_label');
            recycle_path_label.innerHTML = selectedDir;

            ApiClient.updatePluginConfiguration(pluginId, config).then(Dashboard.processPluginConfigurationUpdateResult);
        });
    }

    function loadPageSettings(view) {
        ApiClient.getPluginConfiguration(pluginId).then(function (config) {
            console.log("Config: " + JSON.stringify(config));

            var recycle_path_label = view.querySelector('#recycle_path_label');
            if (config.RecycledPath) {
                recycle_path_label.innerHTML = config.RecycledPath;
            }
            else {
                recycle_path_label.innerHTML = "Not Set";
            }
        });
    }

    return function (view, params) {

        // init code here
        view.addEventListener('viewshow', function (e) {
            mainTabsManager.setTabs(this, 2, getTabs);

            loadPageSettings(view);

            var set_recycle_path = view.querySelector('#set_recycle_path');
            set_recycle_path.addEventListener("click", setRecyclePathPicker);

            function setRecyclePathPicker() {
                require(['directorybrowser'], function (directoryBrowser) {
                    var picker = new directoryBrowser();
                    picker.show({
                        includeFiles: false,
                        callback: function (selected) {
                            picker.close();
                            setRecyclePathCallBack(selected, view);
                        },
                        header: "Select recycle path"
                    });
                });
            }

        });

        view.addEventListener('viewhide', function (e) {

        });

        view.addEventListener('viewdestroy', function (e) {

        });
    };
});
