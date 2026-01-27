using Cmf.LightBusinessObjects.Infrastructure;
using Microsoft.Extensions.Options;
using System.Net.Http.Headers;

namespace IndustrialEquipmentSimulator.Objects
{
    public class Events
    {
        public Dictionary<string, Dictionary<string, DefectCharacteristics[]>> Defects;

        public Events(IndustrialEquipmentSimulator.Services.ITokenService tokenService, IOptions<ClientConfiguration> clientConfiguration)
        {
            Defects = new Dictionary<string, Dictionary<string, DefectCharacteristics[]>>() {
                { "White",
                    new Dictionary<string, DefectCharacteristics[]>()
                    {
                        {
                            "Light Scratch",
                            [
                                new DefectCharacteristics(tokenService, clientConfiguration.Value, "", 597.0165491532197m, 388.70620586673397m, "White-Light-Scratch.png",
                                    "{\"id\":\"Polygon_5344\",\"points\":[{\"absoluteX\":342,\"x\":0.2523338870431894,\"absoluteY\":183,\"y\":0.2026578073089701,\"$id\":\"2\"},{\"absoluteX\":285,\"x\":0.2102782392026578,\"absoluteY\":292,\"y\":0.3233665559246955,\"$id\":\"3\"},{\"absoluteX\":989,\"x\":0.7297023809523809,\"absoluteY\":621,\"y\":0.6877076411960132,\"$id\":\"4\"},{\"absoluteX\":994,\"x\":0.733391472868217,\"absoluteY\":576,\"y\":0.6378737541528239,\"$id\":\"5\"},{\"x\":0.2530717054263566,\"absoluteX\":342,\"y\":0.20376522702104097,\"absoluteY\":183,\"$id\":\"6\"}],\"isFinished\":true,\"styleToApply\":{\"borderWidth\":0.003,\"borderColor\":\"#ea4232\",\"proportionalSelectionPoints\":true,\"$id\":\"7\"},\"borderWidth\":0.003,\"borderColor\":\"#ea4232\",\"proportionalSelectionPoints\":true,\"borderWidthAbsolute\":4.066041275797374,\"minPosition\":{\"x\":0.2102782392026578,\"absoluteX\":285,\"y\":0.2026578073089701,\"absoluteY\":183,\"$id\":\"8\"},\"maxPosition\":{\"x\":0.733391472868217,\"absoluteX\":994,\"y\":0.6877076411960132,\"absoluteY\":621,\"$id\":\"9\"},\"$id\":\"1\"}",
                                    "One Scratch",
                                    "Light Scratch")
                            ]
                        },
                        {
                            "Mild Scratch",
                            [
                                new DefectCharacteristics(tokenService, clientConfiguration.Value, "", 706.2785315019241m, 438.10855032162016m, "White-Mild-Scratch.png",
                                    "{\"id\":\"Polygon_5705\",\"points\":[{\"absoluteX\":334,\"x\":0.24643133997785163,\"absoluteY\":199,\"y\":0.2203765227021041,\"$id\":\"2\"},{\"absoluteX\":1060,\"x\":0.7820874861572537,\"absoluteY\":595,\"y\":0.6589147286821705,\"$id\":\"3\"},{\"absoluteX\":1048,\"x\":0.773233665559247,\"absoluteY\":642,\"y\":0.7109634551495017,\"$id\":\"4\"},{\"absoluteX\":508,\"x\":0.37481173864894796,\"absoluteY\":386,\"y\":0.4274640088593577,\"$id\":\"5\"},{\"x\":0.24790697674418605,\"absoluteX\":336,\"y\":0.2203765227021041,\"absoluteY\":199,\"$id\":\"6\"}],\"isFinished\":true,\"styleToApply\":{\"borderWidth\":0.003,\"borderColor\":\"#ea4232\",\"proportionalSelectionPoints\":true,\"$id\":\"7\"},\"borderWidth\":0.003,\"borderColor\":\"#ea4232\",\"proportionalSelectionPoints\":true,\"borderWidthAbsolute\":4.066041275797374,\"minPosition\":{\"x\":0.24643133997785163,\"absoluteX\":334,\"y\":0.2203765227021041,\"absoluteY\":199,\"$id\":\"8\"},\"maxPosition\":{\"x\":0.7820874861572537,\"absoluteX\":1060,\"y\":0.7109634551495017,\"absoluteY\":642,\"$id\":\"9\"},\"$id\":\"1\"}",
                                    "One Mild Scratch",
                                    "Scruff Mark"),
                                new DefectCharacteristics(tokenService, clientConfiguration.Value, "", 247.50000000000003m, 258.5m, "White-Mild-Scratch.png",
                                    "{\"id\":\"Shape_5724\",\"position\":{\"x\":0.0007378183831672204,\"y\":0.12846068660022147,\"absoluteX\":1,\"absoluteY\":115.99999999999999,\"$id\":\"2\"},\"position2\":{\"x\":0.3644822812846069,\"y\":0.4440753045404208,\"absoluteX\":494.00000000000006,\"absoluteY\":401,\"$id\":\"3\"},\"fontSize\":0,\"isInBold\":false,\"rect\":{\"height\":0,\"width\":0,\"absoluteWidth\":493.00000000000006,\"absoluteHeight\":285,\"$id\":\"4\"},\"isInItalic\":false,\"isInUnderline\":false,\"text\":null,\"backgroundColor\":null,\"textColor\":null,\"borderColor\":\"#ea4232\",\"borderWidth\":0.003,\"pointer\":{\"position\":{\"x\":0.5,\"y\":0.5,\"$id\":\"6\"},\"pointerColor\":null,\"pointerWidth\":null,\"$id\":\"5\"},\"sentences\":[\"\"],\"customData\":{\"shapeType\":0,\"mode\":2,\"$id\":\"7\"},\"fontSizeAbsolute\":0,\"borderWidthAbsolute\":4.066041275797374,\"points\":[{\"x\":null,\"absoluteX\":1,\"y\":null,\"absoluteY\":115.99999999999999,\"$id\":\"8\"},{\"x\":null,\"absoluteX\":1,\"y\":null,\"absoluteY\":401,\"$id\":\"9\"},{\"x\":null,\"absoluteX\":494.00000000000006,\"y\":null,\"absoluteY\":401,\"$id\":\"10\"},{\"x\":null,\"absoluteX\":494.00000000000006,\"y\":null,\"absoluteY\":115.99999999999999,\"$id\":\"11\"},{\"x\":null,\"absoluteX\":1,\"y\":null,\"absoluteY\":115.99999999999999,\"isFinal\":true,\"$id\":\"12\"}],\"$id\":\"1\"}",
                                    "Large Scruff Mark",
                                    "Scruff Mark")
                            ]
                        },
                        {
                            "Heavy Scratch",
                            [
                                new DefectCharacteristics(tokenService, clientConfiguration.Value, "", 712.2663898900497m, 431.83023860577583m, "White-Heavy-Scratch.png",
                                    "{\"id\":\"Polygon_5904\",\"points\":[{\"absoluteX\":358,\"x\":0.2641389811738649,\"absoluteY\":128,\"y\":0.14174972314507198,\"$id\":\"2\"},{\"absoluteX\":1032,\"x\":0.7614285714285715,\"absoluteY\":582,\"y\":0.6445182724252492,\"$id\":\"3\"},{\"absoluteX\":1080,\"x\":0.7968438538205981,\"absoluteY\":734,\"y\":0.8128460686600222,\"$id\":\"4\"},{\"absoluteX\":415,\"x\":0.3061946290143965,\"absoluteY\":307,\"y\":0.3399778516057586,\"$id\":\"5\"},{\"x\":0.26561461794019936,\"absoluteX\":358,\"y\":0.14285714285714285,\"absoluteY\":128,\"$id\":\"6\"}],\"isFinished\":true,\"styleToApply\":{\"borderWidth\":0.003,\"borderColor\":\"#ea4232\",\"proportionalSelectionPoints\":true,\"$id\":\"7\"},\"borderWidth\":0.003,\"borderColor\":\"#ea4232\",\"proportionalSelectionPoints\":true,\"borderWidthAbsolute\":4.066041275797374,\"minPosition\":{\"x\":0.2641389811738649,\"absoluteX\":358,\"y\":0.14174972314507198,\"absoluteY\":128,\"$id\":\"8\"},\"maxPosition\":{\"x\":0.7968438538205981,\"absoluteX\":1080,\"y\":0.8128460686600222,\"absoluteY\":734,\"$id\":\"9\"},\"$id\":\"1\"}",
                                    "Very deep scratch",
                                    "Heavy Scratch")
                            ]
                        }
                    }
                },
                { "Color",
                    new Dictionary<string, DefectCharacteristics[]>()
                    {
                        {
                            "Light Scratch",
                            [
                                new DefectCharacteristics(tokenService, clientConfiguration.Value, "", 695.4691593539361m, 446.05869261096274m, "Grey-Light-Scratch.png",
                                    "{\"id\":\"Polygon_5284\",\"points\":[{\"absoluteX\":320,\"x\":0.23610188261351053,\"absoluteY\":153,\"y\":0.16943521594684385,\"$id\":\"2\"},{\"absoluteX\":266,\"x\":0.19625968992248063,\"absoluteY\":281,\"y\":0.31118493909191586,\"$id\":\"3\"},{\"absoluteX\":1076,\"x\":0.7938925802879292,\"absoluteY\":730,\"y\":0.8084163898117387,\"$id\":\"4\"},{\"absoluteX\":1170,\"x\":0.8632475083056479,\"absoluteY\":652,\"y\":0.7220376522702104,\"$id\":\"5\"},{\"x\":0.23610188261351053,\"absoluteX\":320,\"y\":0.1672203765227021,\"absoluteY\":153,\"$id\":\"6\"}],\"isFinished\":true,\"styleToApply\":{\"borderWidth\":0.003,\"borderColor\":\"#ea4232\",\"proportionalSelectionPoints\":true,\"$id\":\"7\"},\"borderWidth\":0.003,\"borderColor\":\"#ea4232\",\"proportionalSelectionPoints\":true,\"borderWidthAbsolute\":4.066041275797374,\"minPosition\":{\"x\":0.19625968992248063,\"absoluteX\":266,\"y\":0.1672203765227021,\"absoluteY\":151,\"$id\":\"8\"},\"maxPosition\":{\"x\":0.8632475083056479,\"absoluteX\":1170,\"y\":0.8084163898117387,\"absoluteY\":730,\"$id\":\"9\"},\"$id\":\"1\"}",
                                    "Two Light Scratches",
                                    "Light Scratch")
                            ]
                        },
                        {
                            "Mild Scratch",
                            [
                                 new DefectCharacteristics(tokenService, clientConfiguration.Value, "", 767.7888193357677m, 467.45345431915723m, "Grey-Mild-Scratch.png",
                                     "{\"id\":\"Polygon_5398\",\"points\":[{\"absoluteX\":266,\"x\":0.19625968992248063,\"absoluteY\":161,\"y\":0.17829457364341086,\"$id\":\"2\"},{\"absoluteX\":249.99999999999997,\"x\":0.1844545957918051,\"absoluteY\":204,\"y\":0.22591362126245848,\"$id\":\"3\"},{\"absoluteX\":1213,\"x\":0.8949736987818384,\"absoluteY\":804,\"y\":0.8903654485049833,\"$id\":\"4\"},{\"absoluteX\":1251,\"x\":0.9230107973421927,\"absoluteY\":741,\"y\":0.8205980066445183,\"$id\":\"5\"},{\"absoluteX\":716,\"x\":0.5282779623477298,\"absoluteY\":342,\"y\":0.3787375415282392,\"$id\":\"6\"},{\"x\":0.1955218715393134,\"absoluteX\":265,\"y\":0.1760797342192691,\"absoluteY\":159,\"$id\":\"7\"}],\"isFinished\":true,\"styleToApply\":{\"borderWidth\":0.003,\"borderColor\":\"#ea4232\",\"proportionalSelectionPoints\":true,\"$id\":\"8\"},\"borderWidth\":0.003,\"borderColor\":\"#ea4232\",\"proportionalSelectionPoints\":true,\"borderWidthAbsolute\":4.066041275797374,\"minPosition\":{\"x\":0.1844545957918051,\"absoluteX\":250,\"y\":0.1760797342192691,\"absoluteY\":159,\"$id\":\"9\"},\"maxPosition\":{\"x\":0.9230107973421927,\"absoluteX\":1251,\"y\":0.8903654485049833,\"absoluteY\":804,\"$id\":\"10\"},\"$id\":\"1\"}",
                                     "",
                                     "Mild Scratch"),
                                 new DefectCharacteristics(tokenService, clientConfiguration.Value, "", 471.77161479116796m, 607.5809390795424m, "Grey-Mild-Scratch.png",
                                     "{\"id\":\"Polygon_5417\",\"points\":[{\"absoluteX\":299,\"x\":0.2206076965669989,\"absoluteY\":474.99999999999994,\"y\":0.5260243632336655,\"$id\":\"2\"},{\"absoluteX\":303,\"x\":0.2235589700996678,\"absoluteY\":538,\"y\":0.5957918050941307,\"$id\":\"3\"},{\"absoluteX\":631,\"x\":0.4655633997785161,\"absoluteY\":730,\"y\":0.8084163898117387,\"$id\":\"4\"},{\"absoluteX\":671,\"x\":0.4950761351052049,\"absoluteY\":701,\"y\":0.7763012181616833,\"$id\":\"5\"},{\"x\":0.2206076965669989,\"absoluteX\":299,\"y\":0.5249169435215947,\"absoluteY\":474,\"$id\":\"6\"}],\"isFinished\":true,\"styleToApply\":{\"borderWidth\":0.003,\"borderColor\":\"#ea4232\",\"proportionalSelectionPoints\":true,\"$id\":\"7\"},\"borderWidth\":0.003,\"borderColor\":\"#ea4232\",\"proportionalSelectionPoints\":true,\"borderWidthAbsolute\":4.066041275797374,\"minPosition\":{\"x\":0.2206076965669989,\"absoluteX\":299,\"y\":0.5249169435215947,\"absoluteY\":474,\"$id\":\"8\"},\"maxPosition\":{\"x\":0.4950761351052049,\"absoluteX\":671,\"y\":0.8084163898117387,\"absoluteY\":730,\"$id\":\"9\"},\"$id\":\"1\"}",
                                     "OneLigth Scratch",
                                     "Light Scratch"),
                                 new DefectCharacteristics(tokenService, clientConfiguration.Value, "", 704.058750373097m, 605.8903757503399m, "Grey-Mild-Scratch.png",
                                     "{\"id\":\"Polygon_5436\",\"points\":[{\"absoluteX\":394,\"x\":0.29070044296788483,\"absoluteY\":333,\"y\":0.3687707641196013,\"$id\":\"2\"},{\"absoluteX\":947,\"x\":0.6987140088593577,\"absoluteY\":885,\"y\":0.9800664451827242,\"$id\":\"3\"},{\"absoluteX\":989.9999999999999,\"x\":0.7304401993355482,\"absoluteY\":849,\"y\":0.9401993355481728,\"$id\":\"4\"},{\"absoluteX\":543,\"x\":0.4006353820598007,\"absoluteY\":408,\"y\":0.45182724252491696,\"$id\":\"5\"},{\"absoluteX\":390,\"x\":0.28774916943521595,\"absoluteY\":300,\"y\":0.33222591362126247,\"$id\":\"6\"},{\"x\":0.29143826135105205,\"absoluteX\":395,\"y\":0.36766334440753046,\"absoluteY\":332,\"$id\":\"7\"}],\"isFinished\":true,\"styleToApply\":{\"borderWidth\":0.003,\"borderColor\":\"#ea4232\",\"proportionalSelectionPoints\":true,\"$id\":\"8\"},\"borderWidth\":0.003,\"borderColor\":\"#ea4232\",\"proportionalSelectionPoints\":true,\"borderWidthAbsolute\":4.066041275797374,\"minPosition\":{\"x\":0.28774916943521595,\"absoluteX\":390,\"y\":0.33222591362126247,\"absoluteY\":300,\"$id\":\"9\"},\"maxPosition\":{\"x\":0.7304401993355482,\"absoluteX\":990,\"y\":0.9800664451827242,\"absoluteY\":885,\"$id\":\"10\"},\"$id\":\"1\"}",
                                     "One Ligth Scratch",
                                     "Light Scratch")
                            ]
                        },
                        {
                            "Heavy Scratch",
                            [
                                new DefectCharacteristics(tokenService, clientConfiguration.Value, "", 688.5597951757674m, 437.91007649421516m, "Grey-Light-Scratch.png",
                                    "{\"id\":\"Polygon_5826\",\"points\":[{\"absoluteX\":373.00000000000006,\"x\":0.27520625692137324,\"absoluteY\":138,\"y\":0.15282392026578073,\"$id\":\"2\"},{\"absoluteX\":1058,\"x\":0.7806118493909192,\"absoluteY\":651,\"y\":0.7209302325581395,\"$id\":\"3\"},{\"absoluteX\":981.0000000000001,\"x\":0.7237998338870433,\"absoluteY\":719,\"y\":0.7962347729789591,\"$id\":\"4\"},{\"absoluteX\":357,\"x\":0.2634011627906977,\"absoluteY\":259,\"y\":0.2868217054263566,\"$id\":\"5\"},{\"x\":0.27225498338870435,\"absoluteX\":369,\"y\":0.15614617940199335,\"absoluteY\":141,\"$id\":\"6\"}],\"isFinished\":true,\"styleToApply\":{\"borderWidth\":0.003,\"borderColor\":\"#ea4232\",\"proportionalSelectionPoints\":true,\"$id\":\"7\"},\"borderWidth\":0.003,\"borderColor\":\"#ea4232\",\"proportionalSelectionPoints\":true,\"borderWidthAbsolute\":4.066041275797374,\"minPosition\":{\"x\":0.2634011627906977,\"absoluteX\":357,\"y\":0.15282392026578073,\"absoluteY\":138,\"$id\":\"8\"},\"maxPosition\":{\"x\":0.7806118493909192,\"absoluteX\":1058,\"y\":0.7962347729789591,\"absoluteY\":719,\"$id\":\"9\"},\"$id\":\"1\"}",
                                    "Deep Scratch, may not be salvagable",
                                    "Heavy Scratch"),

                                new DefectCharacteristics(tokenService, clientConfiguration.Value, "", 431.5m, 635.5m, "Grey-Heavy-Scratch.png",
                                    "{\"id\":\"Polygon_5826\",\"points\":[{\"absoluteX\":373.00000000000006,\"x\":0.27520625692137324,\"absoluteY\":138,\"y\":0.15282392026578073,\"$id\":\"2\"},{\"absoluteX\":1058,\"x\":0.7806118493909192,\"absoluteY\":651,\"y\":0.7209302325581395,\"$id\":\"3\"},{\"absoluteX\":981.0000000000001,\"x\":0.7237998338870433,\"absoluteY\":719,\"y\":0.7962347729789591,\"$id\":\"4\"},{\"absoluteX\":357,\"x\":0.2634011627906977,\"absoluteY\":259,\"y\":0.2868217054263566,\"$id\":\"5\"},{\"x\":0.27225498338870435,\"absoluteX\":369,\"y\":0.15614617940199335,\"absoluteY\":141,\"$id\":\"6\"}],\"isFinished\":true,\"styleToApply\":{\"borderWidth\":0.003,\"borderColor\":\"#ea4232\",\"proportionalSelectionPoints\":true,\"$id\":\"7\"},\"borderWidth\":0.003,\"borderColor\":\"#ea4232\",\"proportionalSelectionPoints\":true,\"borderWidthAbsolute\":4.066041275797374,\"minPosition\":{\"x\":0.2634011627906977,\"absoluteX\":357,\"y\":0.15282392026578073,\"absoluteY\":138,\"$id\":\"8\"},\"maxPosition\":{\"x\":0.7806118493909192,\"absoluteX\":1058,\"y\":0.7962347729789591,\"absoluteY\":719,\"$id\":\"9\"},\"$id\":\"1\"}",
                                    "Big Scruff Mark",
                                    "Scruff Mark")
                            ]
                        }
                    }
                }
            };
        }
    }

    public class DefectCharacteristics
    {
        public string EventContent { get; set; }
        public decimal CoordinateX { get; set; }
        public decimal CoordinateY { get; set; }
        public string Reason { get; set; }
        public string Remark { get; set; }
        public string FileName { get; set; }
        public string Shape { get; set; }
        public string Checksum { get; set; }
        private readonly IndustrialEquipmentSimulator.Services.ITokenService _tokenService;
        private readonly Cmf.LightBusinessObjects.Infrastructure.ClientConfiguration _clientConfiguration;

        public DefectCharacteristics(IndustrialEquipmentSimulator.Services.ITokenService tokenService, Cmf.LightBusinessObjects.Infrastructure.ClientConfiguration clientConfiguration,
            string eventContent, decimal coordinateX, decimal coordinateY, string fileName, string shape, string remark = "", string reason = "")
        {
            EventContent = eventContent;
            CoordinateX = coordinateX;
            CoordinateY = coordinateY;
            Remark = remark;
            Reason = reason;
            Shape = shape;
            FileName = fileName;
            _tokenService = tokenService;
            _clientConfiguration = clientConfiguration;

            var fileLocation = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "DefectImages", fileName);
            Checksum = UploadImageAsync(fileLocation).GetAwaiter().GetResult();
        }

        public async Task<string> UploadImageAsync(string filePath)
        {
            using var http = new HttpClient();

            var request = new HttpRequestMessage(
                HttpMethod.Post,
                $"https://{_clientConfiguration.HostAddress}/api/GenericService/UploadFile");

            // Required headers
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _tokenService.AccessToken);
            request.Headers.Add("Cmf_ClientTenantName", _clientConfiguration.ClientTenantName);
            request.Headers.Add("Cmf_HostName", _clientConfiguration.HostAddress);

            // Create form-data body
            var form = new MultipartFormDataContent();

            var bytes = await File.ReadAllBytesAsync(filePath);
            var fileContent = new ByteArrayContent(bytes);
            fileContent.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg"); // or png

            // IMPORTANT → field name must match browser
            form.Add(fileContent, "attachment-file", Path.GetFileName(filePath));

            request.Content = form;

            var response = await http.SendAsync(request);
            response.EnsureSuccessStatusCode();

            var responseBody = await response.Content.ReadAsStringAsync();
            return responseBody;
        }
    }
}