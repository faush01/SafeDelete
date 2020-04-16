using MediaBrowser.Common.Configuration;
using MediaBrowser.Common.Plugins;
using MediaBrowser.Model.Drawing;
using MediaBrowser.Model.Plugins;
using MediaBrowser.Model.Serialization;
using System;
using System.Collections.Generic;
using System.IO;
using System.Text;

namespace SafeDelete
{
    class Plugin : BasePlugin<PluginSettings>, IHasWebPages, IHasThumbImage
    {
        private static string PluginName = "Safe Delete";
        private static string PluginDescription = "Safe delete files from your Emby library.";
        private Guid _id = new Guid("5fde15c6-f70d-4e35-ad38-aaf5aa26bf82");

        public override string Name
        {
            get { return PluginName; }
        }

        public override Guid Id
        {
            get { return _id; }
        }

        public Plugin(IApplicationPaths applicationPaths, IXmlSerializer xmlSerializer) : base(applicationPaths, xmlSerializer)
        {
            Instance = this;
        }

        public Stream GetThumbImage()
        {
            var type = GetType();
            return type.Assembly.GetManifestResourceStream(type.Namespace + ".Media.recycling-symbol.png");
        }

        public ImageFormat ThumbImageFormat
        {
            get
            {
                return ImageFormat.Png;
            }
        }

        public static Plugin Instance { get; private set; }

        public override string Description
        {
            get
            {
                return PluginDescription;
            }
        }

        public IEnumerable<PluginPageInfo> GetPages()
        {
            return new[]
            {
                new PluginPageInfo
                {
                    Name = "ItemListPage",
                    EmbeddedResourcePath = GetType().Namespace + ".Pages.ItemListPage.html",
                    EnableInMainMenu = true
                },
                new PluginPageInfo
                {
                    Name = "ItemListPage.js",
                    EmbeddedResourcePath = GetType().Namespace + ".Pages.ItemListPage.js"
                },
                new PluginPageInfo
                {
                    Name = "SettingsPage",
                    EmbeddedResourcePath = GetType().Namespace + ".Pages.SettingsPage.html",
                },
                new PluginPageInfo
                {
                    Name = "SettingsPage.js",
                    EmbeddedResourcePath = GetType().Namespace + ".Pages.SettingsPage.js"
                },
            };
        }
    }
}
