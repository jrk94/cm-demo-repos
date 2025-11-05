using CFX.Structures.SolderReflow;
using Newtonsoft.Json;
using System.Collections.Immutable;

namespace IPCCFXSimulator.Objects
{
    public class Events
    {
        public Dictionary<string, ReflowProcessData> Products { get; set; }

        public static readonly ImmutableDictionary<string, string> Defects =
            new Dictionary<string, string>
            {
                { "Voiding", ZoneData_Voiding },
                { "ColdSolderJoint", ZoneData_ColdSolderJoint },
                { "Tombstone", ZoneData_Tombstoning },
                { "SolderBalling", ZoneData_SolderBalling }
            }.ToImmutableDictionary();

        public const string ZoneData_Voiding = """
[
    {
        "Zone": { "ReflowZoneType": "PreHeat", "StageSequence": 1, "StageName": "Zone1", "StageType": "Work" },
        "Setpoints": [
            { "SubZone": "Bottom", "SetpointType": "Temperature", "Setpoint": 115.0 },
            { "SubZone": "Top", "SetpointType": "Temperature", "Setpoint": 135.0 },
            { "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 125.0 }
        ],
        "Readings": [
            { "SubZone": "Bottom", "ReadingType": "Temperature", "ReadingValue": 117.2 },
            { "SubZone": "Top", "ReadingType": "Temperature", "ReadingValue": 136.0 },
            { "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 125.9 },
            { "SubZone": "Bottom", "ReadingType": "Power", "ReadingValue": 125.0 },
            { "SubZone": "Bottom", "ReadingType": "PowerLevel", "ReadingValue": 30.0 },
            { "SubZone": "Top", "ReadingType": "Power", "ReadingValue": 210.0 },
            { "SubZone": "Top", "ReadingType": "PowerLevel", "ReadingValue": 50.0 }
        ]
    },
    {
        "Zone": { "ReflowZoneType": "PreHeat", "StageSequence": 2, "StageName": "Zone2", "StageType": "Work" },
        "Setpoints": [
            { "SubZone": "Bottom", "SetpointType": "Temperature", "Setpoint": 135.0 },
            { "SubZone": "Top", "SetpointType": "Temperature", "Setpoint": 155.0 },
            { "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 145.0 }
        ],
        "Readings": [
            { "SubZone": "Bottom", "ReadingType": "Temperature", "ReadingValue": 138.6 },
            { "SubZone": "Top", "ReadingType": "Temperature", "ReadingValue": 154.3 },
            { "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 146.7 },
            { "SubZone": "Bottom", "ReadingType": "Power", "ReadingValue": 160.0 },
            { "SubZone": "Bottom", "ReadingType": "PowerLevel", "ReadingValue": 40.0 },
            { "SubZone": "Top", "ReadingType": "Power", "ReadingValue": 218.0 },
            { "SubZone": "Top", "ReadingType": "PowerLevel", "ReadingValue": 55.0 }
        ]
    },
    {
        "Zone": { "ReflowZoneType": "PreHeat", "StageSequence": 3, "StageName": "Zone3", "StageType": "Work" },
        "Setpoints": [
            { "SubZone": "Bottom", "SetpointType": "Temperature", "Setpoint": 150.0 },
            { "SubZone": "Top", "SetpointType": "Temperature", "Setpoint": 170.0 },
            { "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 160.0 }
        ],
        "Readings": [
            { "SubZone": "Bottom", "ReadingType": "Temperature", "ReadingValue": 152.0 },
            { "SubZone": "Top", "ReadingType": "Temperature", "ReadingValue": 168.2 },
            { "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 159.0 },
            { "SubZone": "Bottom", "ReadingType": "Power", "ReadingValue": 175.0 },
            { "SubZone": "Bottom", "ReadingType": "PowerLevel", "ReadingValue": 45.0 },
            { "SubZone": "Top", "ReadingType": "Power", "ReadingValue": 220.0 },
            { "SubZone": "Top", "ReadingType": "PowerLevel", "ReadingValue": 60.0 }
        ]
    },
    {
        "Zone": { "ReflowZoneType": "PreHeat", "StageSequence": 4, "StageName": "Zone4", "StageType": "Work" },
        "Setpoints": [
            { "SubZone": "Bottom", "SetpointType": "Temperature", "Setpoint": 170.0 },
            { "SubZone": "Top", "SetpointType": "Temperature", "Setpoint": 190.0 },
            { "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 180.0 }
        ],
        "Readings": [
            { "SubZone": "Bottom", "ReadingType": "Temperature", "ReadingValue": 172.0 },
            { "SubZone": "Top", "ReadingType": "Temperature", "ReadingValue": 192.3 },
            { "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 180.7 },
            { "SubZone": "Bottom", "ReadingType": "Power", "ReadingValue": 180.0 },
            { "SubZone": "Bottom", "ReadingType": "PowerLevel", "ReadingValue": 50.0 },
            { "SubZone": "Top", "ReadingType": "Power", "ReadingValue": 222.0 },
            { "SubZone": "Top", "ReadingType": "PowerLevel", "ReadingValue": 62.0 }
        ]
    },
    {
        "Zone": { "ReflowZoneType": "Reflow", "StageSequence": 1, "StageName": "Zone1", "StageType": "Work" },
        "Setpoints": [
            { "SubZone": "Bottom", "SetpointType": "Temperature", "Setpoint": 263.0 },
            { "SubZone": "Top", "SetpointType": "Temperature", "Setpoint": 273.0 },
            { "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 262.0 },
            { "SubZone": "WholeZone", "SetpointType": "O2", "Setpoint": 500.0 },
            { "SubZone": "WholeZone", "SetpointType": "Vacuum", "Setpoint": 300.0 },
            { "SubZone": "WholeZone", "SetpointType": "VacuumHoldTime", "Setpoint": 7.0 }
        ],
        "Readings": [
            { "SubZone": "Bottom", "ReadingType": "Temperature", "ReadingValue": 265.0 },
            { "SubZone": "Top", "ReadingType": "Temperature", "ReadingValue": 270.0 },
            { "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 260.5 },
            { "SubZone": "WholeZone", "ReadingType": "O2", "ReadingValue": 498.0 },
            { "SubZone": "WholeZone", "ReadingType": "Vacuum", "ReadingValue": 170.0 },
            { "SubZone": "WholeZone", "ReadingType": "VacuumHoldTime", "ReadingValue": 7.0 },
            { "SubZone": "WholeZone", "ReadingType": "ConvectionRate", "ReadingValue": 160.0 }
        ]
    },
    {
        "Zone": { "ReflowZoneType": "Reflow", "StageSequence": 2, "StageName": "Zone2", "StageType": "Work" },
        "Setpoints": [
            { "SubZone": "Bottom", "SetpointType": "Temperature", "Setpoint": 263.0 },
            { "SubZone": "Top", "SetpointType": "Temperature", "Setpoint": 273.0 },
            { "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 262.0 },
            { "SubZone": "WholeZone", "SetpointType": "O2", "Setpoint": 500.0 },
            { "SubZone": "WholeZone", "SetpointType": "Vacuum", "Setpoint": 300.0 },
            { "SubZone": "WholeZone", "SetpointType": "VacuumHoldTime", "Setpoint": 7.0 }
        ],
        "Readings": [
            { "SubZone": "Bottom", "ReadingType": "Temperature", "ReadingValue": 268.0 },
            { "SubZone": "Top", "ReadingType": "Temperature", "ReadingValue": 270.5 },
            { "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 261.0 },
            { "SubZone": "WholeZone", "ReadingType": "O2", "ReadingValue": 505.0 },
            { "SubZone": "WholeZone", "ReadingType": "Vacuum", "ReadingValue": 175.0 },
            { "SubZone": "WholeZone", "ReadingType": "VacuumHoldTime", "ReadingValue": 7.0 },
            { "SubZone": "WholeZone", "ReadingType": "ConvectionRate", "ReadingValue": 165.0 }
        ]
    },
    {
        "Zone": { "ReflowZoneType": "Reflow", "StageSequence": 3, "StageName": "Zone3", "StageType": "Work" },
        "Setpoints": [
            { "SubZone": "Bottom", "SetpointType": "Temperature", "Setpoint": 225.0 },
            { "SubZone": "Top", "SetpointType": "Temperature", "Setpoint": 235.0 },
            { "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 230.0 },
            { "SubZone": "WholeZone", "SetpointType": "O2", "Setpoint": 500.0 },
            { "SubZone": "WholeZone", "SetpointType": "Vacuum", "Setpoint": 300.0 },
            { "SubZone": "WholeZone", "SetpointType": "VacuumHoldTime", "Setpoint": 7.0 }
        ],
        "Readings": [
            { "SubZone": "Bottom", "ReadingType": "Temperature", "ReadingValue": 228.0 },
            { "SubZone": "Top", "ReadingType": "Temperature", "ReadingValue": 233.0 },
            { "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 229.5 },
            { "SubZone": "WholeZone", "ReadingType": "O2", "ReadingValue": 500.0 },
            { "SubZone": "WholeZone", "ReadingType": "Vacuum", "ReadingValue": 160.0 },
            { "SubZone": "WholeZone", "ReadingType": "VacuumHoldTime", "ReadingValue": 7.0 },
            { "SubZone": "WholeZone", "ReadingType": "ConvectionRate", "ReadingValue": 155.0 }
        ]
    },
    {
        "Zone": { "ReflowZoneType": "Cool", "StageSequence": 1, "StageName": "Zone1", "StageType": "Work" },
        "Setpoints": [{ "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 160.0 }],
        "Readings": [{ "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 155.0 }]
    },
    {
        "Zone": { "ReflowZoneType": "Cool", "StageSequence": 2, "StageName": "Zone2", "StageType": "Work" },
        "Setpoints": [{ "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 60.0 }],
        "Readings": [{ "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 48.0 }]
    },
    {
        "Zone": { "ReflowZoneType": "Cool", "StageSequence": 3, "StageName": "Zone3", "StageType": "Work" },
        "Setpoints": [{ "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 40.0 }],
        "Readings": [{ "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 29.0 }]
    },
    {
        "Zone": { "ReflowZoneType": "Cool", "StageSequence": 4, "StageName": "Zone4", "StageType": "Work" },
        "Setpoints": [{ "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 40.0 }],
        "Readings": [{ "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 27.0 }]
    }
]
""";

        public const string ZoneData_ColdSolderJoint = """
[
	{
		"Zone": { "ReflowZoneType": "PreHeat", "StageSequence": 1, "StageName": "Zone1", "StageType": "Work" },
		"Setpoints": [
			{ "SubZone": "Bottom", "SetpointType": "Temperature", "Setpoint": 115.0 },
			{ "SubZone": "Top", "SetpointType": "Temperature", "Setpoint": 135.0 },
			{ "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 125.0 }
		],
		"Readings": [
			{ "SubZone": "Bottom", "ReadingType": "Temperature", "ReadingValue": 112.0 },
			{ "SubZone": "Top", "ReadingType": "Temperature", "ReadingValue": 131.0 },
			{ "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 122.5 },
			{ "SubZone": "Bottom", "ReadingType": "Power", "ReadingValue": 110.0 },
			{ "SubZone": "Bottom", "ReadingType": "PowerLevel", "ReadingValue": 26.0 },
			{ "SubZone": "Top", "ReadingType": "Power", "ReadingValue": 205.0 },
			{ "SubZone": "Top", "ReadingType": "PowerLevel", "ReadingValue": 50.0 }
		]
	},
	{
		"Zone": { "ReflowZoneType": "PreHeat", "StageSequence": 2, "StageName": "Zone2", "StageType": "Work" },
		"Setpoints": [
			{ "SubZone": "Bottom", "SetpointType": "Temperature", "Setpoint": 135.0 },
			{ "SubZone": "Top", "SetpointType": "Temperature", "Setpoint": 155.0 },
			{ "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 145.0 }
		],
		"Readings": [
			{ "SubZone": "Bottom", "ReadingType": "Temperature", "ReadingValue": 132.5 },
			{ "SubZone": "Top", "ReadingType": "Temperature", "ReadingValue": 152.0 },
			{ "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 142.1 },
			{ "SubZone": "Bottom", "ReadingType": "Power", "ReadingValue": 145.0 },
			{ "SubZone": "Bottom", "ReadingType": "PowerLevel", "ReadingValue": 34.0 },
			{ "SubZone": "Top", "ReadingType": "Power", "ReadingValue": 210.0 },
			{ "SubZone": "Top", "ReadingType": "PowerLevel", "ReadingValue": 56.0 }
		]
	},
	{
		"Zone": { "ReflowZoneType": "PreHeat", "StageSequence": 3, "StageName": "Zone3", "StageType": "Work" },
		"Setpoints": [
			{ "SubZone": "Bottom", "SetpointType": "Temperature", "Setpoint": 150.0 },
			{ "SubZone": "Top", "SetpointType": "Temperature", "Setpoint": 170.0 },
			{ "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 160.0 }
		],
		"Readings": [
			{ "SubZone": "Bottom", "ReadingType": "Temperature", "ReadingValue": 148.9 },
			{ "SubZone": "Top", "ReadingType": "Temperature", "ReadingValue": 167.2 },
			{ "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 158.0 },
			{ "SubZone": "Bottom", "ReadingType": "Power", "ReadingValue": 155.0 },
			{ "SubZone": "Bottom", "ReadingType": "PowerLevel", "ReadingValue": 38.0 },
			{ "SubZone": "Top", "ReadingType": "Power", "ReadingValue": 212.0 },
			{ "SubZone": "Top", "ReadingType": "PowerLevel", "ReadingValue": 58.0 }
		]
	},
	{
		"Zone": { "ReflowZoneType": "PreHeat", "StageSequence": 4, "StageName": "Zone4", "StageType": "Work" },
		"Setpoints": [
			{ "SubZone": "Bottom", "SetpointType": "Temperature", "Setpoint": 170.0 },
			{ "SubZone": "Top", "SetpointType": "Temperature", "Setpoint": 190.0 },
			{ "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 180.0 }
		],
		"Readings": [
			{ "SubZone": "Bottom", "ReadingType": "Temperature", "ReadingValue": 168.1 },
			{ "SubZone": "Top", "ReadingType": "Temperature", "ReadingValue": 188.2 },
			{ "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 178.3 },
			{ "SubZone": "Bottom", "ReadingType": "Power", "ReadingValue": 160.0 },
			{ "SubZone": "Bottom", "ReadingType": "PowerLevel", "ReadingValue": 40.0 },
			{ "SubZone": "Top", "ReadingType": "Power", "ReadingValue": 215.0 },
			{ "SubZone": "Top", "ReadingType": "PowerLevel", "ReadingValue": 60.0 }
		]
	},
	{
		"Zone": { "ReflowZoneType": "PreHeat", "StageSequence": 5, "StageName": "Zone5", "StageType": "Work" },
		"Setpoints": [
			{ "SubZone": "Bottom", "SetpointType": "Temperature", "Setpoint": 180.0 },
			{ "SubZone": "Top", "SetpointType": "Temperature", "Setpoint": 200.0 },
			{ "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 190.0 }
		],
		"Readings": [
			{ "SubZone": "Bottom", "ReadingType": "Temperature", "ReadingValue": 178.0 },
			{ "SubZone": "Top", "ReadingType": "Temperature", "ReadingValue": 197.5 },
			{ "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 187.2 },
			{ "SubZone": "Bottom", "ReadingType": "Power", "ReadingValue": 165.0 },
			{ "SubZone": "Bottom", "ReadingType": "PowerLevel", "ReadingValue": 42.0 },
			{ "SubZone": "Top", "ReadingType": "Power", "ReadingValue": 218.0 },
			{ "SubZone": "Top", "ReadingType": "PowerLevel", "ReadingValue": 62.0 }
		]
	},
	{
		"Zone": { "ReflowZoneType": "PreHeat", "StageSequence": 6, "StageName": "Zone6", "StageType": "Work" },
		"Setpoints": [
			{ "SubZone": "Bottom", "SetpointType": "Temperature", "Setpoint": 200.0 },
			{ "SubZone": "Top", "SetpointType": "Temperature", "Setpoint": 210.0 },
			{ "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 205.0 }
		],
		"Readings": [
			{ "SubZone": "Bottom", "ReadingType": "Temperature", "ReadingValue": 198.5 },
			{ "SubZone": "Top", "ReadingType": "Temperature", "ReadingValue": 207.0 },
			{ "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 203.0 },
			{ "SubZone": "Bottom", "ReadingType": "Power", "ReadingValue": 170.0 },
			{ "SubZone": "Bottom", "ReadingType": "PowerLevel", "ReadingValue": 44.0 },
			{ "SubZone": "Top", "ReadingType": "Power", "ReadingValue": 220.0 },
			{ "SubZone": "Top", "ReadingType": "PowerLevel", "ReadingValue": 64.0 }
		]
	},
	{
		"Zone": { "ReflowZoneType": "PreHeat", "StageSequence": 7, "StageName": "Zone7", "StageType": "Work" },
		"Setpoints": [
			{ "SubZone": "Bottom", "SetpointType": "Temperature", "Setpoint": 225.0 },
			{ "SubZone": "Top", "SetpointType": "Temperature", "Setpoint": 235.0 },
			{ "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 220.0 }
		],
		"Readings": [
			{ "SubZone": "Bottom", "ReadingType": "Temperature", "ReadingValue": 222.7 },
			{ "SubZone": "Top", "ReadingType": "Temperature", "ReadingValue": 232.1 },
			{ "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 218.9 },
			{ "SubZone": "Bottom", "ReadingType": "Power", "ReadingValue": 175.0 },
			{ "SubZone": "Bottom", "ReadingType": "PowerLevel", "ReadingValue": 46.0 },
			{ "SubZone": "Top", "ReadingType": "Power", "ReadingValue": 222.0 },
			{ "SubZone": "Top", "ReadingType": "PowerLevel", "ReadingValue": 66.0 }
		]
	},
	{
		"Zone": { "ReflowZoneType": "Reflow", "StageSequence": 1, "StageName": "Zone1", "StageType": "Work" },
		"Setpoints": [
			{ "SubZone": "Bottom", "SetpointType": "Temperature", "Setpoint": 263.0 },
			{ "SubZone": "Top", "SetpointType": "Temperature", "Setpoint": 273.0 },
			{ "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 262.0 },
			{ "SubZone": "WholeZone", "SetpointType": "O2", "Setpoint": 500.0 },
			{ "SubZone": "WholeZone", "SetpointType": "Vacuum", "Setpoint": 225.0 },
			{ "SubZone": "WholeZone", "SetpointType": "VacuumHoldTime", "Setpoint": 5.0 }
		],
		"Readings": [
			{ "SubZone": "Bottom", "ReadingType": "Temperature", "ReadingValue": 229.0 },
			{ "SubZone": "Top", "ReadingType": "Temperature", "ReadingValue": 233.5 },
			{ "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 231.1 },
			{ "SubZone": "Top", "ReadingType": "Power", "ReadingValue": 208.0 },
			{ "SubZone": "Top", "ReadingType": "PowerLevel", "ReadingValue": 62.0 },
			{ "SubZone": "Bottom", "ReadingType": "Power", "ReadingValue": 198.0 },
			{ "SubZone": "Bottom", "ReadingType": "PowerLevel", "ReadingValue": 58.0 },
			{ "SubZone": "WholeZone", "ReadingType": "O2", "ReadingValue": 498.0 },
			{ "SubZone": "WholeZone", "ReadingType": "Vacuum", "ReadingValue": 225.0 },
			{ "SubZone": "WholeZone", "ReadingType": "VacuumHoldTime", "ReadingValue": 5.0 },
			{ "SubZone": "WholeZone", "ReadingType": "ConvectionRate", "ReadingValue": 245.0 }
		]
	},
	{
		"Zone": { "ReflowZoneType": "Reflow", "StageSequence": 2, "StageName": "Zone2", "StageType": "Work" },
		"Setpoints": [
			{ "SubZone": "Bottom", "SetpointType": "Temperature", "Setpoint": 263.0 },
			{ "SubZone": "Top", "SetpointType": "Temperature", "Setpoint": 273.0 },
			{ "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 262.0 },
			{ "SubZone": "WholeZone", "SetpointType": "O2", "Setpoint": 500.0 },
			{ "SubZone": "WholeZone", "SetpointType": "Vacuum", "Setpoint": 300 },
			{ "SubZone": "WholeZone", "SetpointType": "VacuumHoldTime", "Setpoint": 7 }
		],
		"Readings": [
			{ "SubZone": "Bottom", "ReadingType": "Temperature", "ReadingValue": 231.0 },
			{ "SubZone": "Top", "ReadingType": "Temperature", "ReadingValue": 234.7 },
			{ "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 233.0 },
			{ "SubZone": "Top", "ReadingType": "Power", "ReadingValue": 210.0 },
			{ "SubZone": "Top", "ReadingType": "PowerLevel", "ReadingValue": 64.0 },
			{ "SubZone": "Bottom", "ReadingType": "Power", "ReadingValue": 200.0 },
			{ "SubZone": "Bottom", "ReadingType": "PowerLevel", "ReadingValue": 60.0 },
			{ "SubZone": "WholeZone", "ReadingType": "O2", "ReadingValue": 500 },
			{ "SubZone": "WholeZone", "ReadingType": "Vacuum", "ReadingValue": 300 },
			{ "SubZone": "WholeZone", "ReadingType": "VacuumHoldTime", "ReadingValue": 7.0 },
			{ "SubZone": "WholeZone", "ReadingType": "ConvectionRate", "ReadingValue": 250.0 }
		]
	},
	{
		"Zone": { "ReflowZoneType": "Reflow", "StageSequence": 3, "StageName": "Zone3", "StageType": "Work" },
		"Setpoints": [
			{ "SubZone": "Bottom", "SetpointType": "Temperature", "Setpoint": 225.0 },
			{ "SubZone": "Top", "SetpointType": "Temperature", "Setpoint": 235.0 },
			{ "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 230.0 },
			{ "SubZone": "WholeZone", "SetpointType": "O2", "Setpoint": 500.0 },
			{ "SubZone": "WholeZone", "SetpointType": "Vacuum", "Setpoint": 300 },
			{ "SubZone": "WholeZone", "SetpointType": "VacuumHoldTime", "Setpoint": 7 }
		],
		"Readings": [
			{ "SubZone": "Bottom", "ReadingType": "Temperature", "ReadingValue": 212.5 },
			{ "SubZone": "Top", "ReadingType": "Temperature", "ReadingValue": 218.0 },
			{ "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 215.8 },
			{ "SubZone": "Top", "ReadingType": "Power", "ReadingValue": 200.0 },
			{ "SubZone": "Top", "ReadingType": "PowerLevel", "ReadingValue": 58.0 },
			{ "SubZone": "Bottom", "ReadingType": "Power", "ReadingValue": 195.0 },
			{ "SubZone": "Bottom", "ReadingType": "PowerLevel", "ReadingValue": 56.0 },
			{ "SubZone": "WholeZone", "ReadingType": "O2", "ReadingValue": 501 },
			{ "SubZone": "WholeZone", "ReadingType": "Vacuum", "ReadingValue": 300 },
			{ "SubZone": "WholeZone", "ReadingType": "VacuumHoldTime", "ReadingValue": 7.0 },
			{ "SubZone": "WholeZone", "ReadingType": "ConvectionRate", "ReadingValue": 245.0 }
		]
	},
	{
		"Zone": { "ReflowZoneType": "Cool", "StageSequence": 1, "StageName": "Zone1", "StageType": "Work" },
		"Setpoints": [
			{ "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 160.0 }
		],
		"Readings": [
			{ "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 159.5 }
		]
	},
	{
		"Zone": { "ReflowZoneType": "Cool", "StageSequence": 2, "StageName": "Zone2", "StageType": "Work" },
		"Setpoints": [
			{ "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 60.0 }
		],
		"Readings": [
			{ "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 47.2 }
		]
	},
	{
		"Zone": { "ReflowZoneType": "Cool", "StageSequence": 3, "StageName": "Zone3", "StageType": "Work" },
		"Setpoints": [
			{ "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 40.0 }
		],
		"Readings": [
			{ "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 29.1 }
		]
	},
	{
		"Zone": { "ReflowZoneType": "Cool", "StageSequence": 4, "StageName": "Zone4", "StageType": "Work" },
		"Setpoints": [
			{ "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 40.0 }
		],
		"Readings": [
			{ "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 27.6 }
		]
	}
]
""";

        public const string ZoneData_Tombstoning = """
[
	{
		"Zone": { "ReflowZoneType": "PreHeat", "StageSequence": 1, "StageName": "Zone1", "StageType": "Work" },
		"Setpoints": [
			{ "SubZone": "Bottom", "SetpointType": "Temperature", "Setpoint": 115.0 },
			{ "SubZone": "Top", "SetpointType": "Temperature", "Setpoint": 135.0 },
			{ "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 125.0 }
		],
		"Readings": [
			{ "SubZone": "Bottom", "ReadingType": "Temperature", "ReadingValue": 118.2 },
			{ "SubZone": "Top", "ReadingType": "Temperature", "ReadingValue": 146.8 },
			{ "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 133.1 },
			{ "SubZone": "Bottom", "ReadingType": "Power", "ReadingValue": 120.0 },
			{ "SubZone": "Bottom", "ReadingType": "PowerLevel", "ReadingValue": 28.0 },
			{ "SubZone": "Top", "ReadingType": "Power", "ReadingValue": 210.0 },
			{ "SubZone": "Top", "ReadingType": "PowerLevel", "ReadingValue": 52.0 }
		]
	},
	{
		"Zone": { "ReflowZoneType": "PreHeat", "StageSequence": 2, "StageName": "Zone2", "StageType": "Work" },
		"Setpoints": [
			{ "SubZone": "Bottom", "SetpointType": "Temperature", "Setpoint": 135.0 },
			{ "SubZone": "Top", "SetpointType": "Temperature", "Setpoint": 155.0 },
			{ "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 145.0 }
		],
		"Readings": [
			{ "SubZone": "Bottom", "ReadingType": "Temperature", "ReadingValue": 138.7 },
			{ "SubZone": "Top", "ReadingType": "Temperature", "ReadingValue": 168.9 },
			{ "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 156.3 },
			{ "SubZone": "Bottom", "ReadingType": "Power", "ReadingValue": 150.0 },
			{ "SubZone": "Bottom", "ReadingType": "PowerLevel", "ReadingValue": 36.0 },
			{ "SubZone": "Top", "ReadingType": "Power", "ReadingValue": 220.0 },
			{ "SubZone": "Top", "ReadingType": "PowerLevel", "ReadingValue": 58.0 }
		]
	},
	{
		"Zone": { "ReflowZoneType": "PreHeat", "StageSequence": 3, "StageName": "Zone3", "StageType": "Work" },
		"Setpoints": [
			{ "SubZone": "Bottom", "SetpointType": "Temperature", "Setpoint": 150.0 },
			{ "SubZone": "Top", "SetpointType": "Temperature", "Setpoint": 170.0 },
			{ "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 160.0 }
		],
		"Readings": [
			{ "SubZone": "Bottom", "ReadingType": "Temperature", "ReadingValue": 153.5 },
			{ "SubZone": "Top", "ReadingType": "Temperature", "ReadingValue": 183.6 },
			{ "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 171.8 },
			{ "SubZone": "Bottom", "ReadingType": "Power", "ReadingValue": 165.0 },
			{ "SubZone": "Bottom", "ReadingType": "PowerLevel", "ReadingValue": 40.0 },
			{ "SubZone": "Top", "ReadingType": "Power", "ReadingValue": 225.0 },
			{ "SubZone": "Top", "ReadingType": "PowerLevel", "ReadingValue": 62.0 }
		]
	},
	{
		"Zone": { "ReflowZoneType": "PreHeat", "StageSequence": 4, "StageName": "Zone4", "StageType": "Work" },
		"Setpoints": [
			{ "SubZone": "Bottom", "SetpointType": "Temperature", "Setpoint": 170.0 },
			{ "SubZone": "Top", "SetpointType": "Temperature", "Setpoint": 190.0 },
			{ "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 180.0 }
		],
		"Readings": [
			{ "SubZone": "Bottom", "ReadingType": "Temperature", "ReadingValue": 173.9 },
			{ "SubZone": "Top", "ReadingType": "Temperature", "ReadingValue": 206.4 },
			{ "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 192.7 },
			{ "SubZone": "Bottom", "ReadingType": "Power", "ReadingValue": 175.0 },
			{ "SubZone": "Bottom", "ReadingType": "PowerLevel", "ReadingValue": 44.0 },
			{ "SubZone": "Top", "ReadingType": "Power", "ReadingValue": 230.0 },
			{ "SubZone": "Top", "ReadingType": "PowerLevel", "ReadingValue": 64.0 }
		]
	},
	{
		"Zone": { "ReflowZoneType": "PreHeat", "StageSequence": 5, "StageName": "Zone5", "StageType": "Work" },
		"Setpoints": [
			{ "SubZone": "Bottom", "SetpointType": "Temperature", "Setpoint": 180.0 },
			{ "SubZone": "Top", "SetpointType": "Temperature", "Setpoint": 200.0 },
			{ "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 190.0 }
		],
		"Readings": [
			{ "SubZone": "Bottom", "ReadingType": "Temperature", "ReadingValue": 184.8 },
			{ "SubZone": "Top", "ReadingType": "Temperature", "ReadingValue": 214.1 },
			{ "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 201.0 },
			{ "SubZone": "Bottom", "ReadingType": "Power", "ReadingValue": 180.0 },
			{ "SubZone": "Bottom", "ReadingType": "PowerLevel", "ReadingValue": 46.0 },
			{ "SubZone": "Top", "ReadingType": "Power", "ReadingValue": 232.0 },
			{ "SubZone": "Top", "ReadingType": "PowerLevel", "ReadingValue": 66.0 }
		]
	},
	{
		"Zone": { "ReflowZoneType": "PreHeat", "StageSequence": 6, "StageName": "Zone6", "StageType": "Work" },
		"Setpoints": [
			{ "SubZone": "Bottom", "SetpointType": "Temperature", "Setpoint": 200.0 },
			{ "SubZone": "Top", "SetpointType": "Temperature", "Setpoint": 210.0 },
			{ "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 205.0 }
		],
		"Readings": [
			{ "SubZone": "Bottom", "ReadingType": "Temperature", "ReadingValue": 202.6 },
			{ "SubZone": "Top", "ReadingType": "Temperature", "ReadingValue": 228.9 },
			{ "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 216.0 },
			{ "SubZone": "Bottom", "ReadingType": "Power", "ReadingValue": 185.0 },
			{ "SubZone": "Bottom", "ReadingType": "PowerLevel", "ReadingValue": 48.0 },
			{ "SubZone": "Top", "ReadingType": "Power", "ReadingValue": 235.0 },
			{ "SubZone": "Top", "ReadingType": "PowerLevel", "ReadingValue": 68.0 }
		]
	},
	{
		"Zone": { "ReflowZoneType": "PreHeat", "StageSequence": 7, "StageName": "Zone7", "StageType": "Work" },
		"Setpoints": [
			{ "SubZone": "Bottom", "SetpointType": "Temperature", "Setpoint": 225.0 },
			{ "SubZone": "Top", "SetpointType": "Temperature", "Setpoint": 235.0 },
			{ "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 220.0 }
		],
		"Readings": [
			{ "SubZone": "Bottom", "ReadingType": "Temperature", "ReadingValue": 227.4 },
			{ "SubZone": "Top", "ReadingType": "Temperature", "ReadingValue": 256.8 },
			{ "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 243.5 },
			{ "SubZone": "Bottom", "ReadingType": "Power", "ReadingValue": 190.0 },
			{ "SubZone": "Bottom", "ReadingType": "PowerLevel", "ReadingValue": 50.0 },
			{ "SubZone": "Top", "ReadingType": "Power", "ReadingValue": 240.0 },
			{ "SubZone": "Top", "ReadingType": "PowerLevel", "ReadingValue": 70.0 }
		]
	},
	{
		"Zone": { "ReflowZoneType": "Reflow", "StageSequence": 1, "StageName": "Zone1", "StageType": "Work" },
		"Setpoints": [
			{ "SubZone": "Bottom", "SetpointType": "Temperature", "Setpoint": 263.0 },
			{ "SubZone": "Top", "SetpointType": "Temperature", "Setpoint": 273.0 },
			{ "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 262.0 },
			{ "SubZone": "WholeZone", "SetpointType": "O2", "Setpoint": 500.0 },
			{ "SubZone": "WholeZone", "SetpointType": "Vacuum", "Setpoint": 225.0 },
			{ "SubZone": "WholeZone", "SetpointType": "VacuumHoldTime", "Setpoint": 5.0 }
		],
		"Readings": [
			{ "SubZone": "Bottom", "ReadingType": "Temperature", "ReadingValue": 252.1 },
			{ "SubZone": "Top", "ReadingType": "Temperature", "ReadingValue": 281.4 },
			{ "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 266.3 },
			{ "SubZone": "Top", "ReadingType": "Power", "ReadingValue": 235.0 },
			{ "SubZone": "Top", "ReadingType": "PowerLevel", "ReadingValue": 76.0 },
			{ "SubZone": "Bottom", "ReadingType": "Power", "ReadingValue": 210.0 },
			{ "SubZone": "Bottom", "ReadingType": "PowerLevel", "ReadingValue": 62.0 },
			{ "SubZone": "WholeZone", "ReadingType": "O2", "ReadingValue": 505.0 },
			{ "SubZone": "WholeZone", "ReadingType": "Vacuum", "ReadingValue": 224.0 },
			{ "SubZone": "WholeZone", "ReadingType": "VacuumHoldTime", "ReadingValue": 5.0 },
			{ "SubZone": "WholeZone", "ReadingType": "ConvectionRate", "ReadingValue": 260.0 }
		]
	},
	{
		"Zone": { "ReflowZoneType": "Reflow", "StageSequence": 2, "StageName": "Zone2", "StageType": "Work" },
		"Setpoints": [
			{ "SubZone": "Bottom", "SetpointType": "Temperature", "Setpoint": 263.0 },
			{ "SubZone": "Top", "SetpointType": "Temperature", "Setpoint": 273.0 },
			{ "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 262.0 },
			{ "SubZone": "WholeZone", "SetpointType": "O2", "Setpoint": 500.0 },
			{ "SubZone": "WholeZone", "SetpointType": "Vacuum", "Setpoint": 300 },
			{ "SubZone": "WholeZone", "SetpointType": "VacuumHoldTime", "Setpoint": 7 }
		],
		"Readings": [
			{ "SubZone": "Bottom", "ReadingType": "Temperature", "ReadingValue": 255.0 },
			{ "SubZone": "Top", "ReadingType": "Temperature", "ReadingValue": 283.7 },
			{ "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 270.2 },
			{ "SubZone": "Top", "ReadingType": "Power", "ReadingValue": 236.0 },
			{ "SubZone": "Top", "ReadingType": "PowerLevel", "ReadingValue": 77.0 },
			{ "SubZone": "Bottom", "ReadingType": "Power", "ReadingValue": 212.0 },
			{ "SubZone": "Bottom", "ReadingType": "PowerLevel", "ReadingValue": 64.0 },
			{ "SubZone": "WholeZone", "ReadingType": "O2", "ReadingValue": 502 },
			{ "SubZone": "WholeZone", "ReadingType": "Vacuum", "ReadingValue": 299 },
			{ "SubZone": "WholeZone", "ReadingType": "VacuumHoldTime", "ReadingValue": 7.0 },
			{ "SubZone": "WholeZone", "ReadingType": "ConvectionRate", "ReadingValue": 275.0 }
		]
	},
	{
		"Zone": { "ReflowZoneType": "Reflow", "StageSequence": 3, "StageName": "Zone3", "StageType": "Work" },
		"Setpoints": [
			{ "SubZone": "Bottom", "SetpointType": "Temperature", "Setpoint": 225.0 },
			{ "SubZone": "Top", "SetpointType": "Temperature", "Setpoint": 235.0 },
			{ "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 230.0 },
			{ "SubZone": "WholeZone", "SetpointType": "O2", "Setpoint": 500.0 },
			{ "SubZone": "WholeZone", "SetpointType": "Vacuum", "Setpoint": 300 },
			{ "SubZone": "WholeZone", "SetpointType": "VacuumHoldTime", "Setpoint": 7 }
		],
		"Readings": [
			{ "SubZone": "Bottom", "ReadingType": "Temperature", "ReadingValue": 223.0 },
			{ "SubZone": "Top", "ReadingType": "Temperature", "ReadingValue": 249.8 },
			{ "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 238.6 },
			{ "SubZone": "Top", "ReadingType": "Power", "ReadingValue": 220.0 },
			{ "SubZone": "Top", "ReadingType": "PowerLevel", "ReadingValue": 62.0 },
			{ "SubZone": "Bottom", "ReadingType": "Power", "ReadingValue": 205.0 },
			{ "SubZone": "Bottom", "ReadingType": "PowerLevel", "ReadingValue": 58.0 },
			{ "SubZone": "WholeZone", "ReadingType": "O2", "ReadingValue": 503 },
			{ "SubZone": "WholeZone", "ReadingType": "Vacuum", "ReadingValue": 300 },
			{ "SubZone": "WholeZone", "ReadingType": "VacuumHoldTime", "ReadingValue": 7.0 },
			{ "SubZone": "WholeZone", "ReadingType": "ConvectionRate", "ReadingValue": 270.0 }
		]
	},
	{
		"Zone": { "ReflowZoneType": "Cool", "StageSequence": 1, "StageName": "Zone1", "StageType": "Work" },
		"Setpoints": [
			{ "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 160.0 }
		],
		"Readings": [
			{ "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 160.3 }
		]
	},
	{
		"Zone": { "ReflowZoneType": "Cool", "StageSequence": 2, "StageName": "Zone2", "StageType": "Work" },
		"Setpoints": [
			{ "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 60.0 }
		],
		"Readings": [
			{ "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 46.9 }
		]
	},
	{
		"Zone": { "ReflowZoneType": "Cool", "StageSequence": 3, "StageName": "Zone3", "StageType": "Work" },
		"Setpoints": [
			{ "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 40.0 }
		],
		"Readings": [
			{ "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 28.8 }
		]
	},
	{
		"Zone": { "ReflowZoneType": "Cool", "StageSequence": 4, "StageName": "Zone4", "StageType": "Work" },
		"Setpoints": [
			{ "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 40.0 }
		],
		"Readings": [
			{ "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 27.4 }
		]
	}
]
""";

        public const string ZoneData_SolderBalling = """
        [
            {
                "Zone": {
                    "ReflowZoneType": "PreHeat",
                    "StageSequence": 1,
                    "StageName": "Zone1",
                    "StageType": "Work"
                },
                "Setpoints": [
                    { "SubZone": "Bottom", "SetpointType": "Temperature", "Setpoint": 115.0 },
                    { "SubZone": "Top", "SetpointType": "Temperature", "Setpoint": 135.0 },
                    { "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 125.0 }
                ],
                "Readings": [
                    { "SubZone": "Bottom", "ReadingType": "Temperature", "ReadingValue": 148.0 },
                    { "SubZone": "Top", "ReadingType": "Temperature", "ReadingValue": 155.2 },
                    { "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 150.6 },
                    { "SubZone": "Bottom", "ReadingType": "Power", "ReadingValue": 190.0 },
                    { "SubZone": "Bottom", "ReadingType": "PowerLevel", "ReadingValue": 50.0 },
                    { "SubZone": "Top", "ReadingType": "Power", "ReadingValue": 210.0 },
                    { "SubZone": "Top", "ReadingType": "PowerLevel", "ReadingValue": 55.0 }
                ]
            },
            {
                "Zone": {
                    "ReflowZoneType": "PreHeat",
                    "StageSequence": 2,
                    "StageName": "Zone2",
                    "StageType": "Work"
                },
                "Setpoints": [
                    { "SubZone": "Bottom", "SetpointType": "Temperature", "Setpoint": 135.0 },
                    { "SubZone": "Top", "SetpointType": "Temperature", "Setpoint": 155.0 },
                    { "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 145.0 }
                ],
                "Readings": [
                    { "SubZone": "Bottom", "ReadingType": "Temperature", "ReadingValue": 172.0 },
                    { "SubZone": "Top", "ReadingType": "Temperature", "ReadingValue": 176.5 },
                    { "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 169.3 },
                    { "SubZone": "Bottom", "ReadingType": "Power", "ReadingValue": 200.0 },
                    { "SubZone": "Bottom", "ReadingType": "PowerLevel", "ReadingValue": 60.0 },
                    { "SubZone": "Top", "ReadingType": "Power", "ReadingValue": 215.0 },
                    { "SubZone": "Top", "ReadingType": "PowerLevel", "ReadingValue": 65.0 }
                ]
            },
            {
                "Zone": {
                    "ReflowZoneType": "PreHeat",
                    "StageSequence": 3,
                    "StageName": "Zone3",
                    "StageType": "Work"
                },
                "Setpoints": [
                    { "SubZone": "Bottom", "SetpointType": "Temperature", "Setpoint": 150.0 },
                    { "SubZone": "Top", "SetpointType": "Temperature", "Setpoint": 170.0 },
                    { "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 160.0 }
                ],
                "Readings": [
                    { "SubZone": "Bottom", "ReadingType": "Temperature", "ReadingValue": 182.3 },
                    { "SubZone": "Top", "ReadingType": "Temperature", "ReadingValue": 185.9 },
                    { "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 178.4 },
                    { "SubZone": "Bottom", "ReadingType": "Power", "ReadingValue": 210.0 },
                    { "SubZone": "Bottom", "ReadingType": "PowerLevel", "ReadingValue": 65.0 },
                    { "SubZone": "Top", "ReadingType": "Power", "ReadingValue": 215.0 },
                    { "SubZone": "Top", "ReadingType": "PowerLevel", "ReadingValue": 68.0 }
                ]
            },
            {
                "Zone": {
                    "ReflowZoneType": "PreHeat",
                    "StageSequence": 4,
                    "StageName": "Zone4",
                    "StageType": "Work"
                },
                "Setpoints": [
                    { "SubZone": "Bottom", "SetpointType": "Temperature", "Setpoint": 170.0 },
                    { "SubZone": "Top", "SetpointType": "Temperature", "Setpoint": 190.0 },
                    { "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 180.0 }
                ],
                "Readings": [
                    { "SubZone": "Bottom", "ReadingType": "Temperature", "ReadingValue": 200.0 },
                    { "SubZone": "Top", "ReadingType": "Temperature", "ReadingValue": 202.4 },
                    { "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 197.1 },
                    { "SubZone": "Bottom", "ReadingType": "Power", "ReadingValue": 220.0 },
                    { "SubZone": "Bottom", "ReadingType": "PowerLevel", "ReadingValue": 68.0 },
                    { "SubZone": "Top", "ReadingType": "Power", "ReadingValue": 225.0 },
                    { "SubZone": "Top", "ReadingType": "PowerLevel", "ReadingValue": 70.0 }
                ]
            },
            {
                "Zone": {
                    "ReflowZoneType": "Reflow",
                    "StageSequence": 1,
                    "StageName": "Zone1",
                    "StageType": "Work"
                },
                "Setpoints": [
                    { "SubZone": "Bottom", "SetpointType": "Temperature", "Setpoint": 260.0 },
                    { "SubZone": "Top", "SetpointType": "Temperature", "Setpoint": 270.0 },
                    { "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 262.0 },
                    { "SubZone": "WholeZone", "SetpointType": "O2", "Setpoint": 500.0 }
                ],
                "Readings": [
                    { "SubZone": "Bottom", "ReadingType": "Temperature", "ReadingValue": 285.7 },
                    { "SubZone": "Top", "ReadingType": "Temperature", "ReadingValue": 288.2 },
                    { "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 280.0 },
                    { "SubZone": "WholeZone", "ReadingType": "O2", "ReadingValue": 680.0 },
                    { "SubZone": "WholeZone", "ReadingType": "ConvectionRate", "ReadingValue": 310.0 }
                ]
            },
            {
                "Zone": {
                    "ReflowZoneType": "Reflow",
                    "StageSequence": 2,
                    "StageName": "Zone2",
                    "StageType": "Work"
                },
                "Setpoints": [
                    { "SubZone": "Bottom", "SetpointType": "Temperature", "Setpoint": 260.0 },
                    { "SubZone": "Top", "SetpointType": "Temperature", "Setpoint": 270.0 },
                    { "SubZone": "WholeZone", "SetpointType": "O2", "Setpoint": 500.0 }
                ],
                "Readings": [
                    { "SubZone": "Bottom", "ReadingType": "Temperature", "ReadingValue": 283.5 },
                    { "SubZone": "Top", "ReadingType": "Temperature", "ReadingValue": 287.0 },
                    { "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 275.3 },
                    { "SubZone": "WholeZone", "ReadingType": "O2", "ReadingValue": 670.0 },
                    { "SubZone": "WholeZone", "ReadingType": "ConvectionRate", "ReadingValue": 300.0 }
                ]
            },
            {
                "Zone": {
                    "ReflowZoneType": "Reflow",
                    "StageSequence": 3,
                    "StageName": "Zone3",
                    "StageType": "Work"
                },
                "Setpoints": [
                    { "SubZone": "Bottom", "SetpointType": "Temperature", "Setpoint": 230.0 },
                    { "SubZone": "Top", "SetpointType": "Temperature", "Setpoint": 240.0 },
                    { "SubZone": "WholeZone", "SetpointType": "O2", "Setpoint": 500.0 }
                ],
                "Readings": [
                    { "SubZone": "Bottom", "ReadingType": "Temperature", "ReadingValue": 250.2 },
                    { "SubZone": "Top", "ReadingType": "Temperature", "ReadingValue": 254.0 },
                    { "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 242.8 },
                    { "SubZone": "WholeZone", "ReadingType": "O2", "ReadingValue": 650.0 },
                    { "SubZone": "WholeZone", "ReadingType": "ConvectionRate", "ReadingValue": 280.0 }
                ]
            },
            {
                "Zone": {
                    "ReflowZoneType": "Cool",
                    "StageSequence": 1,
                    "StageName": "Zone1",
                    "StageType": "Work"
                },
                "Setpoints": [
                    { "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 160.0 }
                ],
                "Readings": [
                    { "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 100.0 }
                ]
            },
            {
                "Zone": {
                    "ReflowZoneType": "Cool",
                    "StageSequence": 2,
                    "StageName": "Zone2",
                    "StageType": "Work"
                },
                "Setpoints": [
                    { "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 80.0 }
                ],
                "Readings": [
                    { "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 48.0 }
                ]
            },
            {
                "Zone": {
                    "ReflowZoneType": "Cool",
                    "StageSequence": 3,
                    "StageName": "Zone3",
                    "StageType": "Work"
                },
                "Setpoints": [
                    { "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 60.0 }
                ],
                "Readings": [
                    { "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 32.0 }
                ]
            },
            {
                "Zone": {
                    "ReflowZoneType": "Cool",
                    "StageSequence": 4,
                    "StageName": "Zone4",
                    "StageType": "Work"
                },
                "Setpoints": [
                    { "SubZone": "WholeZone", "SetpointType": "Temperature", "Setpoint": 40.0 }
                ],
                "Readings": [
                    { "SubZone": "WholeZone", "ReadingType": "Temperature", "ReadingValue": 22.5 }
                ]
            }
        ]
        """;

        public const string ZoneData_A = """
            [
            	{
            		"Zone": {
            			"ReflowZoneType": "PreHeat",
            			"StageSequence": 1,
            			"StageName": "Zone1",
            			"StageType": "Work"
            		},
            		"Setpoints": [
            			{
            				"SubZone": "Bottom",
            				"SetpointType": "Temperature",
            				"Setpoint": 115.0
            			},
            			{
            				"SubZone": "Top",
            				"SetpointType": "Temperature",
            				"Setpoint": 135.0
            			},
            			{
            				"SubZone": "WholeZone",
            				"SetpointType": "Temperature",
            				"Setpoint": 125.0
            			}
            		],
            		"Readings": [
            			{
            				"SubZone": "Bottom",
            				"ReadingType": "Temperature",
            				"ReadingValue": 126.1
            			},
            			{
            				"SubZone": "Top",
            				"ReadingType": "Temperature",
            				"ReadingValue": 126.0
            			},
            			{
            				"SubZone": "WholeZone",
            				"ReadingType": "Temperature",
            				"ReadingValue": 119.9
            			},
                        {
                          "SubZone": "Bottom",
                          "ReadingType": "Power",
                          "ReadingValue": 115.0
                        },
                        {
                          "SubZone": "Bottom",
                          "ReadingType": "PowerLevel",
                          "ReadingValue": 30.0
                        },
                        {
                          "SubZone": "Top",
                          "ReadingType": "Power",
                          "ReadingValue": 220.0
                        },
                        {
                          "SubZone": "Top",
                          "ReadingType": "PowerLevel",
                          "ReadingValue": 30.0
                        }
            		]
            	},
            	{
            		"Zone": {
            			"ReflowZoneType": "PreHeat",
            			"StageSequence": 2,
            			"StageName": "Zone2",
            			"StageType": "Work"
            		},
            		"Setpoints": [
            			{
            				"SubZone": "Bottom",
            				"SetpointType": "Temperature",
            				"Setpoint": 135.0
            			},
            			{
            				"SubZone": "Top",
            				"SetpointType": "Temperature",
            				"Setpoint": 155.0
            			},
            			{
            				"SubZone": "WholeZone",
            				"SetpointType": "Temperature",
            				"Setpoint": 145.0
            			}
            		],
            		"Readings": [
            			{
            				"SubZone": "Bottom",
            				"ReadingType": "Temperature",
            				"ReadingValue": 145.6
            			},
            			{
            				"SubZone": "Top",
            				"ReadingType": "Temperature",
            				"ReadingValue": 145.1
            			},
            			{
            				"SubZone": "WholeZone",
            				"ReadingType": "Temperature",
            				"ReadingValue": 139.6
            			},
                        {
                          "SubZone": "Bottom",
                          "ReadingType": "Power",
                          "ReadingValue": 195.0
                        },
                        {
                          "SubZone": "Bottom",
                          "ReadingType": "PowerLevel",
                          "ReadingValue": 45.0
                        },
                        {
                          "SubZone": "Top",
                          "ReadingType": "Power",
                          "ReadingValue": 220.0
                        },
                        {
                          "SubZone": "Top",
                          "ReadingType": "PowerLevel",
                          "ReadingValue": 55.0
                        }
            		]
            	},
            	{
            		"Zone": {
            			"ReflowZoneType": "PreHeat",
            			"StageSequence": 3,
            			"StageName": "Zone3",
            			"StageType": "Work"
            		},
            		"Setpoints": [
            			{
            				"SubZone": "Bottom",
            				"SetpointType": "Temperature",
            				"Setpoint": 150.0
            			},
            			{
            				"SubZone": "Top",
            				"SetpointType": "Temperature",
            				"Setpoint": 170.0
            			},
            			{
            				"SubZone": "WholeZone",
            				"SetpointType": "Temperature",
            				"Setpoint": 160.0
            			}
            		],
            		"Readings": [
            			{
            				"SubZone": "Bottom",
            				"ReadingType": "Temperature",
            				"ReadingValue": 162.6
            			},
            			{
            				"SubZone": "Top",
            				"ReadingType": "Temperature",
            				"ReadingValue": 160.8
            			},
            			{
            				"SubZone": "WholeZone",
            				"ReadingType": "Temperature",
            				"ReadingValue": 160.1
            			},
                        {
                          "SubZone": "Bottom",
                          "ReadingType": "Power",
                          "ReadingValue": 210.0
                        },
                        {
                          "SubZone": "Bottom",
                          "ReadingType": "PowerLevel",
                          "ReadingValue": 50.0
                        },
                        {
                          "SubZone": "Top",
                          "ReadingType": "Power",
                          "ReadingValue": 220.0
                        },
                        {
                          "SubZone": "Top",
                          "ReadingType": "PowerLevel",
                          "ReadingValue": 55.0
                        }
            		]
            	},
            	{
            		"Zone": {
            			"ReflowZoneType": "PreHeat",
            			"StageSequence": 4,
            			"StageName": "Zone4",
            			"StageType": "Work"
            		},
            		"Setpoints": [
            			{
            				"SubZone": "Bottom",
            				"SetpointType": "Temperature",
            				"Setpoint": 170.0
            			},
            			{
            				"SubZone": "Top",
            				"SetpointType": "Temperature",
            				"Setpoint": 190.0
            			},
            			{
            				"SubZone": "WholeZone",
            				"SetpointType": "Temperature",
            				"Setpoint": 180.0
            			}
            		],
            		"Readings": [
            			{
            				"SubZone": "Bottom",
            				"ReadingType": "Temperature",
            				"ReadingValue": 180.3
            			},
            			{
            				"SubZone": "Top",
            				"ReadingType": "Temperature",
            				"ReadingValue": 180.1
            			},
            			{
            				"SubZone": "WholeZone",
            				"ReadingType": "Temperature",
            				"ReadingValue": 175.8
            			},
                        {
                          "SubZone": "Bottom",
                          "ReadingType": "Power",
                          "ReadingValue": 220.0
                        },
                        {
                          "SubZone": "Bottom",
                          "ReadingType": "PowerLevel",
                          "ReadingValue": 55.0
                        },
                        {
                          "SubZone": "Top",
                          "ReadingType": "Power",
                          "ReadingValue": 220.0
                        },
                        {
                          "SubZone": "Top",
                          "ReadingType": "PowerLevel",
                          "ReadingValue": 55.0
                        }
            		]
            	},
            	{
            		"Zone": {
            			"ReflowZoneType": "PreHeat",
            			"StageSequence": 5,
            			"StageName": "Zone5",
            			"StageType": "Work"
            		},
            		"Setpoints": [
            			{
            				"SubZone": "Bottom",
            				"SetpointType": "Temperature",
            				"Setpoint": 180.0
            			},
            			{
            				"SubZone": "Top",
            				"SetpointType": "Temperature",
            				"Setpoint": 200.0
            			},
            			{
            				"SubZone": "WholeZone",
            				"SetpointType": "Temperature",
            				"Setpoint": 190.0
            			}
            		],
            		"Readings": [
            			{
            				"SubZone": "Bottom",
            				"ReadingType": "Temperature",
            				"ReadingValue": 190.6
            			},
            			{
            				"SubZone": "Top",
            				"ReadingType": "Temperature",
            				"ReadingValue": 190.3
            			},
            			{
            				"SubZone": "WholeZone",
            				"ReadingType": "Temperature",
            				"ReadingValue": 186.0
            			},
                        {
                          "SubZone": "Bottom",
                          "ReadingType": "Power",
                          "ReadingValue": 220.0
                        },
                        {
                          "SubZone": "Bottom",
                          "ReadingType": "PowerLevel",
                          "ReadingValue": 55.0
                        },
                        {
                          "SubZone": "Top",
                          "ReadingType": "Power",
                          "ReadingValue": 220.0
                        },
                        {
                          "SubZone": "Top",
                          "ReadingType": "PowerLevel",
                          "ReadingValue": 55.0
                        }
            		]
            	},
            	{
            		"Zone": {
            			"ReflowZoneType": "PreHeat",
            			"StageSequence": 6,
            			"StageName": "Zone6",
            			"StageType": "Work"
            		},
            		"Setpoints": [
            			{
            				"SubZone": "Bottom",
            				"SetpointType": "Temperature",
            				"Setpoint": 200.0
            			},
            			{
            				"SubZone": "Top",
            				"SetpointType": "Temperature",
            				"Setpoint": 210.0
            			},
            			{
            				"SubZone": "WholeZone",
            				"SetpointType": "Temperature",
            				"Setpoint": 205.0
            			}
            		],
            		"Readings": [
            			{
            				"SubZone": "Bottom",
            				"ReadingType": "Temperature",
            				"ReadingValue": 206.5
            			},
            			{
            				"SubZone": "Top",
            				"ReadingType": "Temperature",
            				"ReadingValue": 205.6
            			},
            			{
            				"SubZone": "WholeZone",
            				"ReadingType": "Temperature",
            				"ReadingValue": 202.0
            			},
                        {
                          "SubZone": "Bottom",
                          "ReadingType": "Power",
                          "ReadingValue": 220.0
                        },
                        {
                          "SubZone": "Bottom",
                          "ReadingType": "PowerLevel",
                          "ReadingValue": 55.0
                        },
                        {
                          "SubZone": "Top",
                          "ReadingType": "Power",
                          "ReadingValue": 220.0
                        },
                        {
                          "SubZone": "Top",
                          "ReadingType": "PowerLevel",
                          "ReadingValue": 55.0
                        }
            		]
            	},
            	{
            		"Zone": {
            			"ReflowZoneType": "PreHeat",
            			"StageSequence": 7,
            			"StageName": "Zone7",
            			"StageType": "Work"
            		},
            		"Setpoints": [
            			{
            				"SubZone": "Bottom",
            				"SetpointType": "Temperature",
            				"Setpoint": 225.0
            			},
            			{
            				"SubZone": "Top",
            				"SetpointType": "Temperature",
            				"Setpoint": 235.0
            			},
            			{
            				"SubZone": "WholeZone",
            				"SetpointType": "Temperature",
            				"Setpoint": 220.0
            			}
            		],
            		"Readings": [
            			{
            				"SubZone": "Bottom",
            				"ReadingType": "Temperature",
            				"ReadingValue": 230.8
            			},
            			{
            				"SubZone": "Top",
            				"ReadingType": "Temperature",
            				"ReadingValue": 230.6
            			},
            			{
            				"SubZone": "WholeZone",
            				"ReadingType": "Temperature",
            				"ReadingValue": 226.3
            			},
                        {
                          "SubZone": "Bottom",
                          "ReadingType": "Power",
                          "ReadingValue": 220.0
                        },
                        {
                          "SubZone": "Bottom",
                          "ReadingType": "PowerLevel",
                          "ReadingValue": 55.0
                        },
                        {
                          "SubZone": "Top",
                          "ReadingType": "Power",
                          "ReadingValue": 220.0
                        },
                        {
                          "SubZone": "Top",
                          "ReadingType": "PowerLevel",
                          "ReadingValue": 55.0
                        }
            		]
            	},
            	{
            		"Zone": {
            			"ReflowZoneType": "Reflow",
            			"StageSequence": 1,
            			"StageName": "Zone1",
            			"StageType": "Work"
            		},
            		"Setpoints": [
            			{
            				"SubZone": "Bottom",
            				"SetpointType": "Temperature",
            				"Setpoint": 263.0
            			},
            			{
            				"SubZone": "Top",
            				"SetpointType": "Temperature",
            				"Setpoint": 273.0
            			},
            			{
            				"SubZone": "WholeZone",
            				"SetpointType": "Temperature",
            				"Setpoint": 262.0
            			},
                        {
                          "SubZone": "WholeZone",
                          "SetpointType": "O2",
                          "Setpoint": 500.0
                        },
                        {
                          "SubZone": "WholeZone",
                          "SetpointType": "Vacuum",
                          "Setpoint": 225.0
                        },
                        {
                          "SubZone": "WholeZone",
                          "SetpointType": "VacuumHoldTime",
                          "Setpoint": 5.0
                        }
            		],
            		"Readings": [
            			{
            				"SubZone": "Bottom",
            				"ReadingType": "Temperature",
            				"ReadingValue": 268.0
            			},
            			{
            				"SubZone": "Top",
            				"ReadingType": "Temperature",
            				"ReadingValue": 267.7
            			},
            			{
            				"SubZone": "WholeZone",
            				"ReadingType": "Temperature",
            				"ReadingValue": 256.5
            			},
                        {
                          "SubZone": "Top",
                          "ReadingType": "Power",
                          "ReadingValue": 230.0
                        },
                        {
                          "SubZone": "Top",
                          "ReadingType": "PowerLevel",
                          "ReadingValue": 75.0
                        },
                        {
                          "SubZone": "Bottom",
                          "ReadingType": "Power",
                          "ReadingValue": 220.0
                        },
                        {
                          "SubZone": "Bottom",
                          "ReadingType": "PowerLevel",
                          "ReadingValue": 65.0
                        },
                        {
                          "SubZone": "WholeZone",
                          "ReadingType": "O2",
                          "ReadingValue": 498.0
                        },
                        {
                          "SubZone": "WholeZone",
                          "ReadingType": "Vacuum",
                          "ReadingValue": 224.0
                        },
                        {
                          "SubZone": "WholeZone",
                          "ReadingType": "VacuumHoldTime",
                          "ReadingValue": 5.0
                        },
                        {
                          "SubZone": "WholeZone",
                          "ReadingType": "ConvectionRate",
                          "ReadingValue": 250.0
                        }
            		]
            	},
            	{
            		"Zone": {
            			"ReflowZoneType": "Reflow",
            			"StageSequence": 2,
            			"StageName": "Zone2",
            			"StageType": "Work"
            		},
            		"Setpoints": [
            			{
            				"SubZone": "Bottom",
            				"SetpointType": "Temperature",
            				"Setpoint": 263.0
            			},
            			{
            				"SubZone": "Top",
            				"SetpointType": "Temperature",
            				"Setpoint": 273.0
            			},
            			{
            				"SubZone": "WholeZone",
            				"SetpointType": "Temperature",
            				"Setpoint": 262.0
            			},
                        {
                          "SubZone": "WholeZone",
                          "SetpointType": "O2",
                          "Setpoint": 500.0
                        },
                        {
                          "SubZone": "WholeZone",
                          "SetpointType": "Vacuum",
                          "Setpoint": 300
                        },
                        {
                          "SubZone": "WholeZone",
                          "SetpointType": "VacuumHoldTime",
                          "Setpoint": 7
                        }
            		],
            		"Readings": [
            			{
            				"SubZone": "Bottom",
            				"ReadingType": "Temperature",
            				"ReadingValue": 268.5
            			},
            			{
            				"SubZone": "Top",
            				"ReadingType": "Temperature",
            				"ReadingValue": 269.8
            			},
            			{
            				"SubZone": "WholeZone",
            				"ReadingType": "Temperature",
            				"ReadingValue": 261.3
            			},
                        {
                          "SubZone": "Top",
                          "ReadingType": "Power",
                          "ReadingValue": 230.0
                        },
                        {
                          "SubZone": "Top",
                          "ReadingType": "PowerLevel",
                          "ReadingValue": 75.0
                        },
                        {
                          "SubZone": "Bottom",
                          "ReadingType": "Power",
                          "ReadingValue": 220.0
                        },
                        {
                          "SubZone": "Bottom",
                          "ReadingType": "PowerLevel",
                          "ReadingValue": 67
                        },
                        {
                          "SubZone": "WholeZone",
                          "ReadingType": "O2",
                          "ReadingValue": 500
                        },
                        {
                          "SubZone": "WholeZone",
                          "ReadingType": "Vacuum",
                          "ReadingValue": 300
                        },
                        {
                          "SubZone": "WholeZone",
                          "ReadingType": "VacuumHoldTime",
                          "ReadingValue": 7.0
                        },
                        {
                          "SubZone": "WholeZone",
                          "ReadingType": "ConvectionRate",
                          "ReadingValue": 270.0
                        }
            		]
            	},
            	{
            		"Zone": {
            			"ReflowZoneType": "Reflow",
            			"StageSequence": 3,
            			"StageName": "Zone3",
            			"StageType": "Work"
            		},
            		"Setpoints": [
            			{
            				"SubZone": "Bottom",
            				"SetpointType": "Temperature",
            				"Setpoint": 225.0
            			},
            			{
            				"SubZone": "Top",
            				"SetpointType": "Temperature",
            				"Setpoint": 235.0
            			},
            			{
            				"SubZone": "WholeZone",
            				"SetpointType": "Temperature",
            				"Setpoint": 230.0
            			},
                        {
                          "SubZone": "WholeZone",
                          "SetpointType": "O2",
                          "Setpoint": 500.0
                        },
                        {
                          "SubZone": "WholeZone",
                          "SetpointType": "Vacuum",
                          "Setpoint": 300
                        },
                        {
                          "SubZone": "WholeZone",
                          "SetpointType": "VacuumHoldTime",
                          "Setpoint": 7
                        }
            		],
            		"Readings": [
            			{
            				"SubZone": "Bottom",
            				"ReadingType": "Temperature",
            				"ReadingValue": 230.0
            			},
            			{
            				"SubZone": "Top",
            				"ReadingType": "Temperature",
            				"ReadingValue": 230.1
            			},
            			{
            				"SubZone": "WholeZone",
            				"ReadingType": "Temperature",
            				"ReadingValue": 209.6
            			},
                        {
                          "SubZone": "Top",
                          "ReadingType": "Power",
                          "ReadingValue": 211.0
                        },
                        {
                          "SubZone": "Top",
                          "ReadingType": "PowerLevel",
                          "ReadingValue": 55.0
                        },
                        {
                          "SubZone": "Bottom",
                          "ReadingType": "Power",
                          "ReadingValue": 210.0
                        },
                        {
                          "SubZone": "Bottom",
                          "ReadingType": "PowerLevel",
                          "ReadingValue": 55
                        },
                        {
                          "SubZone": "WholeZone",
                          "ReadingType": "O2",
                          "ReadingValue": 500
                        },
                        {
                          "SubZone": "WholeZone",
                          "ReadingType": "Vacuum",
                          "ReadingValue": 300
                        },
                        {
                          "SubZone": "WholeZone",
                          "ReadingType": "VacuumHoldTime",
                          "ReadingValue": 7.0
                        },
                        {
                          "SubZone": "WholeZone",
                          "ReadingType": "ConvectionRate",
                          "ReadingValue": 270.0
                        }
            		]
            	},
            	{
            		"Zone": {
            			"ReflowZoneType": "Cool",
            			"StageSequence": 1,
            			"StageName": "Zone1",
            			"StageType": "Work"
            		},
            		"Setpoints": [
            			{
            				"SubZone": "WholeZone",
            				"SetpointType": "Temperature",
            				"Setpoint": 160.0
            			}
            		],
            		"Readings": [
            			{
            				"SubZone": "WholeZone",
            				"ReadingType": "Temperature",
            				"ReadingValue": 160.1
            			}
            		]
            	},
            	{
            		"Zone": {
            			"ReflowZoneType": "Cool",
            			"StageSequence": 2,
            			"StageName": "Zone2",
            			"StageType": "Work"
            		},
            		"Setpoints": [
            			{
            				"SubZone": "WholeZone",
            				"SetpointType": "Temperature",
            				"Setpoint": 60.0
            			}
            		],
            		"Readings": [
            			{
            				"SubZone": "WholeZone",
            				"ReadingType": "Temperature",
            				"ReadingValue": 46.7
            			}
            		]
            	},
            	{
            		"Zone": {
            			"ReflowZoneType": "Cool",
            			"StageSequence": 3,
            			"StageName": "Zone3",
            			"StageType": "Work"
            		},
            		"Setpoints": [
            			{
            				"SubZone": "WholeZone",
            				"SetpointType": "Temperature",
            				"Setpoint": 40.0
            			}
            		],
            		"Readings": [
            			{
            				"SubZone": "WholeZone",
            				"ReadingType": "Temperature",
            				"ReadingValue": 29.3
            			}
            		]
            	},
            	{
            		"Zone": {
            			"ReflowZoneType": "Cool",
            			"StageSequence": 4,
            			"StageName": "Zone4",
            			"StageType": "Work"
            		},
            		"Setpoints": [
            			{
            				"SubZone": "WholeZone",
            				"SetpointType": "Temperature",
            				"Setpoint": 40.0
            			}
            		],
            		"Readings": [
            			{
            				"SubZone": "WholeZone",
            				"ReadingType": "Temperature",
            				"ReadingValue": 27.7
            			}
            		]
            	}
            ]
            """;

        public const string ZoneData_B = """
             [
               {
                 "Zone": {
                   "ReflowZoneType": "PreHeat",
                   "StageSequence": 1,
                   "StageName": "Zone1",
                   "StageType": "Work"
                 },
                 "Setpoints": [
                   {
                     "SubZone": "Bottom",
                     "SetpointType": "Temperature",
                     "Setpoint": 115.0
                   },
                   {
                     "SubZone": "Top",
                     "SetpointType": "Temperature",
                     "Setpoint": 135.0
                   },
                   {
                     "SubZone": "WholeZone",
                     "SetpointType": "Temperature",
                     "Setpoint": 125.0
                   }
                 ],
                 "Readings": [
                   {
                     "SubZone": "Bottom",
                     "ReadingType": "Temperature",
                     "ReadingValue": 126.4
                   },
                   {
                     "SubZone": "Top",
                     "ReadingType": "Temperature",
                     "ReadingValue": 126.0
                   },
                   {
                     "SubZone": "WholeZone",
                     "ReadingType": "Temperature",
                     "ReadingValue": 119.8
                   },
            	    {
            	      "SubZone": "Bottom",
            	      "ReadingType": "Power",
            	      "ReadingValue": 117.0
            	    },
            	    {
            	      "SubZone": "Bottom",
            	      "ReadingType": "PowerLevel",
            	      "ReadingValue": 32.0
            	    },
            	    {
            	      "SubZone": "Top",
            	      "ReadingType": "Power",
            	      "ReadingValue": 223.0
            	    },
            	    {
            	      "SubZone": "Top",
            	      "ReadingType": "PowerLevel",
            	      "ReadingValue": 31.0
            	    }
                 ]
               },
               {
                 "Zone": {
                   "ReflowZoneType": "PreHeat",
                   "StageSequence": 2,
                   "StageName": "Zone2",
                   "StageType": "Work"
                 },
                 "Setpoints": [
                   {
                     "SubZone": "Bottom",
                     "SetpointType": "Temperature",
                     "Setpoint": 135.0
                   },
                   {
                     "SubZone": "Top",
                     "SetpointType": "Temperature",
                     "Setpoint": 155.0
                   },
                   {
                     "SubZone": "WholeZone",
                     "SetpointType": "Temperature",
                     "Setpoint": 145.0
                   }
                 ],
                 "Readings": [
                   {
                     "SubZone": "Bottom",
                     "ReadingType": "Temperature",
                     "ReadingValue": 145.6
                   },
                   {
                     "SubZone": "Top",
                     "ReadingType": "Temperature",
                     "ReadingValue": 145.3
                   },
                   {
                     "SubZone": "WholeZone",
                     "ReadingType": "Temperature",
                     "ReadingValue": 139.8
                   },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "Power",
                      "ReadingValue": 195.0
                    },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 45.0
                    },
                    {
                      "SubZone": "Top",
                      "ReadingType": "Power",
                      "ReadingValue": 220.0
                    },
                    {
                      "SubZone": "Top",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 55.0
                    }
                 ]
               },
               {
                 "Zone": {
                   "ReflowZoneType": "PreHeat",
                   "StageSequence": 3,
                   "StageName": "Zone3",
                   "StageType": "Work"
                 },
                 "Setpoints": [
                   {
                     "SubZone": "Bottom",
                     "SetpointType": "Temperature",
                     "Setpoint": 150.0
                   },
                   {
                     "SubZone": "Top",
                     "SetpointType": "Temperature",
                     "Setpoint": 170.0
                   },
                   {
                     "SubZone": "WholeZone",
                     "SetpointType": "Temperature",
                     "Setpoint": 160.0
                   }
                 ],
                 "Readings": [
                   {
                     "SubZone": "Bottom",
                     "ReadingType": "Temperature",
                     "ReadingValue": 162.6
                   },
                   {
                     "SubZone": "Top",
                     "ReadingType": "Temperature",
                     "ReadingValue": 160.8
                   },
                   {
                     "SubZone": "WholeZone",
                     "ReadingType": "Temperature",
                     "ReadingValue": 160.1
                   },
            	    {
            	      "SubZone": "Bottom",
            	      "ReadingType": "Power",
            	      "ReadingValue": 210.0
            	    },
            	    {
            	      "SubZone": "Bottom",
            	      "ReadingType": "PowerLevel",
            	      "ReadingValue": 50.0
            	    },
            	    {
            	      "SubZone": "Top",
            	      "ReadingType": "Power",
            	      "ReadingValue": 220.0
            	    },
            	    {
            	      "SubZone": "Top",
            	      "ReadingType": "PowerLevel",
            	      "ReadingValue": 55.0
            	    }
                 ]
               },
               {
                 "Zone": {
                   "ReflowZoneType": "PreHeat",
                   "StageSequence": 4,
                   "StageName": "Zone4",
                   "StageType": "Work"
                 },
                 "Setpoints": [
                   {
                     "SubZone": "Bottom",
                     "SetpointType": "Temperature",
                     "Setpoint": 170.0
                   },
                   {
                     "SubZone": "Top",
                     "SetpointType": "Temperature",
                     "Setpoint": 190.0
                   },
                   {
                     "SubZone": "WholeZone",
                     "SetpointType": "Temperature",
                     "Setpoint": 180.0
                   }
                 ],
                 "Readings": [
                   {
                     "SubZone": "Bottom",
                     "ReadingType": "Temperature",
                     "ReadingValue": 180.3
                   },
                   {
                     "SubZone": "Top",
                     "ReadingType": "Temperature",
                     "ReadingValue": 180.1
                   },
                   {
                     "SubZone": "WholeZone",
                     "ReadingType": "Temperature",
                     "ReadingValue": 176.0
                   },
                {
                  "SubZone": "Bottom",
                  "ReadingType": "Power",
                  "ReadingValue": 220.0
                },
                {
                  "SubZone": "Bottom",
                  "ReadingType": "PowerLevel",
                  "ReadingValue": 55.0
                },
                {
                  "SubZone": "Top",
                  "ReadingType": "Power",
                  "ReadingValue": 220.0
                },
                {
                  "SubZone": "Top",
                  "ReadingType": "PowerLevel",
                  "ReadingValue": 55.0
                }
                 ]
               },
               {
                 "Zone": {
                   "ReflowZoneType": "PreHeat",
                   "StageSequence": 5,
                   "StageName": "Zone5",
                   "StageType": "Work"
                 },
                 "Setpoints": [
                   {
                     "SubZone": "Bottom",
                     "SetpointType": "Temperature",
                     "Setpoint": 180.0
                   },
                   {
                     "SubZone": "Top",
                     "SetpointType": "Temperature",
                     "Setpoint": 200.0
                   },
                   {
                     "SubZone": "WholeZone",
                     "SetpointType": "Temperature",
                     "Setpoint": 190.0
                   }
                 ],
                 "Readings": [
                   {
                     "SubZone": "Bottom",
                     "ReadingType": "Temperature",
                     "ReadingValue": 190.6
                   },
                   {
                     "SubZone": "Top",
                     "ReadingType": "Temperature",
                     "ReadingValue": 190.3
                   },
                   {
                     "SubZone": "WholeZone",
                     "ReadingType": "Temperature",
                     "ReadingValue": 186.0
                   },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "Power",
                      "ReadingValue": 221.0
                    },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 56.0
                    },
                    {
                      "SubZone": "Top",
                      "ReadingType": "Power",
                      "ReadingValue": 219.0
                    },
                    {
                      "SubZone": "Top",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 54.0
                    }
                 ]
               },
               {
                 "Zone": {
                   "ReflowZoneType": "PreHeat",
                   "StageSequence": 6,
                   "StageName": "Zone6",
                   "StageType": "Work"
                 },
                 "Setpoints": [
                   {
                     "SubZone": "Bottom",
                     "SetpointType": "Temperature",
                     "Setpoint": 200.0
                   },
                   {
                     "SubZone": "Top",
                     "SetpointType": "Temperature",
                     "Setpoint": 210.0
                   },
                   {
                     "SubZone": "WholeZone",
                     "SetpointType": "Temperature",
                     "Setpoint": 205.0
                   }
                 ],
                 "Readings": [
                   {
                     "SubZone": "Bottom",
                     "ReadingType": "Temperature",
                     "ReadingValue": 206.3
                   },
                   {
                     "SubZone": "Top",
                     "ReadingType": "Temperature",
                     "ReadingValue": 205.6
                   },
                   {
                     "SubZone": "WholeZone",
                     "ReadingType": "Temperature",
                     "ReadingValue": 202.1
                   },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "Power",
                      "ReadingValue": 220.0
                    },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 55.0
                    },
                    {
                      "SubZone": "Top",
                      "ReadingType": "Power",
                      "ReadingValue": 220.0
                    },
                    {
                      "SubZone": "Top",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 55.0
                    }
                 ]
               },
               {
                 "Zone": {
                   "ReflowZoneType": "PreHeat",
                   "StageSequence": 7,
                   "StageName": "Zone7",
                   "StageType": "Work"
                 },
                 "Setpoints": [
                   {
                     "SubZone": "Bottom",
                     "SetpointType": "Temperature",
                     "Setpoint": 225.0
                   },
                   {
                     "SubZone": "Top",
                     "SetpointType": "Temperature",
                     "Setpoint": 235.0
                   },
                   {
                     "SubZone": "WholeZone",
                     "SetpointType": "Temperature",
                     "Setpoint": 220.0
                   }
                 ],
                 "Readings": [
                   {
                     "SubZone": "Bottom",
                     "ReadingType": "Temperature",
                     "ReadingValue": 230.8
                   },
                   {
                     "SubZone": "Top",
                     "ReadingType": "Temperature",
                     "ReadingValue": 230.8
                   },
                   {
                     "SubZone": "WholeZone",
                     "ReadingType": "Temperature",
                     "ReadingValue": 226.3
                   },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "Power",
                      "ReadingValue": 220.0
                    },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 55.0
                    },
                    {
                      "SubZone": "Top",
                      "ReadingType": "Power",
                      "ReadingValue": 220.0
                    },
                    {
                      "SubZone": "Top",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 55.0
                    }
                 ]
               },
               {
                 "Zone": {
                   "ReflowZoneType": "Reflow",
                   "StageSequence": 1,
                   "StageName": "Zone1",
                   "StageType": "Work"
                 },
                 "Setpoints": [
                   {
                     "SubZone": "Bottom",
                     "SetpointType": "Temperature",
                     "Setpoint": 263.0
                   },
                   {
                     "SubZone": "Top",
                     "SetpointType": "Temperature",
                     "Setpoint": 273.0
                   },
                   {
                     "SubZone": "WholeZone",
                     "SetpointType": "Temperature",
                     "Setpoint": 262.0
                   },
            	    {
            	      "SubZone": "WholeZone",
            	      "SetpointType": "O2",
            	      "Setpoint": 500.0
            	    },
            	    {
            	      "SubZone": "WholeZone",
            	      "SetpointType": "Vacuum",
            	      "Setpoint": 225.0
            	    },
            	    {
            	      "SubZone": "WholeZone",
            	      "SetpointType": "VacuumHoldTime",
            	      "Setpoint": 5.0
            	    }
                 ],
                 "Readings": [
                   {
                     "SubZone": "Bottom",
                     "ReadingType": "Temperature",
                     "ReadingValue": 268.2
                   },
                   {
                     "SubZone": "Top",
                     "ReadingType": "Temperature",
                     "ReadingValue": 267.8
                   },
                   {
                     "SubZone": "WholeZone",
                     "ReadingType": "Temperature",
                     "ReadingValue": 256.0
                   },
                    {
                      "SubZone": "Top",
                      "ReadingType": "Power",
                      "ReadingValue": 230.0
                    },
                    {
                      "SubZone": "Top",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 75.0
                    },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "Power",
                      "ReadingValue": 220.0
                    },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 65.0
                    },
                    {
                      "SubZone": "WholeZone",
                      "ReadingType": "O2",
                      "ReadingValue": 498.0
                    },
                    {
                      "SubZone": "WholeZone",
                      "ReadingType": "Vacuum",
                      "ReadingValue": 224.0
                    },
                    {
                      "SubZone": "WholeZone",
                      "ReadingType": "VacuumHoldTime",
                      "ReadingValue": 5.0
                    },
                    {
                      "SubZone": "WholeZone",
                      "ReadingType": "ConvectionRate",
                      "ReadingValue": 250.0
                    }
                 ]
               },
               {
                 "Zone": {
                   "ReflowZoneType": "Reflow",
                   "StageSequence": 2,
                   "StageName": "Zone2",
                   "StageType": "Work"
                 },
                 "Setpoints": [
                   {
                     "SubZone": "Bottom",
                     "SetpointType": "Temperature",
                     "Setpoint": 263.0
                   },
                   {
                     "SubZone": "Top",
                     "SetpointType": "Temperature",
                     "Setpoint": 273.0
                   },
                   {
                     "SubZone": "WholeZone",
                     "SetpointType": "Temperature",
                     "Setpoint": 262.0
                   },
                    {
                      "SubZone": "WholeZone",
                      "SetpointType": "O2",
                      "Setpoint": 500.0
                    },
                    {
                      "SubZone": "WholeZone",
                      "SetpointType": "Vacuum",
                      "Setpoint": 300
                    },
                    {
                      "SubZone": "WholeZone",
                      "SetpointType": "VacuumHoldTime",
                      "Setpoint": 7
                    }
                 ],
                 "Readings": [
                   {
                     "SubZone": "Bottom",
                     "ReadingType": "Temperature",
                     "ReadingValue": 268.1
                   },
                   {
                     "SubZone": "Top",
                     "ReadingType": "Temperature",
                     "ReadingValue": 269.1
                   },
                   {
                     "SubZone": "WholeZone",
                     "ReadingType": "Temperature",
                     "ReadingValue": 262.1
                   },
                    {
                      "SubZone": "Top",
                      "ReadingType": "Power",
                      "ReadingValue": 230.0
                    },
                    {
                      "SubZone": "Top",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 75.0
                    },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "Power",
                      "ReadingValue": 220.0
                    },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 67
                    },
                    {
                      "SubZone": "WholeZone",
                      "ReadingType": "O2",
                      "ReadingValue": 500
                    },
                    {
                      "SubZone": "WholeZone",
                      "ReadingType": "Vacuum",
                      "ReadingValue": 300
                    },
                    {
                      "SubZone": "WholeZone",
                      "ReadingType": "VacuumHoldTime",
                      "ReadingValue": 7.0
                    },
                    {
                      "SubZone": "WholeZone",
                      "ReadingType": "ConvectionRate",
                      "ReadingValue": 270.0
                    }
                 ]
               },
               {
                 "Zone": {
                   "ReflowZoneType": "Reflow",
                   "StageSequence": 3,
                   "StageName": "Zone3",
                   "StageType": "Work"
                 },
                 "Setpoints": [
                   {
                     "SubZone": "Bottom",
                     "SetpointType": "Temperature",
                     "Setpoint": 225.0
                   },
                   {
                     "SubZone": "Top",
                     "SetpointType": "Temperature",
                     "Setpoint": 235.0
                   },
                   {
                     "SubZone": "WholeZone",
                     "SetpointType": "Temperature",
                     "Setpoint": 230.0
                   },
                    {
                      "SubZone": "WholeZone",
                      "SetpointType": "O2",
                      "Setpoint": 500.0
                    },
                    {
                      "SubZone": "WholeZone",
                      "SetpointType": "Vacuum",
                      "Setpoint": 300
                    },
                    {
                      "SubZone": "WholeZone",
                      "SetpointType": "VacuumHoldTime",
                      "Setpoint": 7
                    }
                 ],
                 "Readings": [
                   {
                     "SubZone": "Bottom",
                     "ReadingType": "Temperature",
                     "ReadingValue": 230.1
                   },
                   {
                     "SubZone": "Top",
                     "ReadingType": "Temperature",
                     "ReadingValue": 230.1
                   },
                   {
                     "SubZone": "WholeZone",
                     "ReadingType": "Temperature",
                     "ReadingValue": 211.5
                   },
                    {
                      "SubZone": "Top",
                      "ReadingType": "Power",
                      "ReadingValue": 211.0
                    },
                    {
                      "SubZone": "Top",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 55.0
                    },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "Power",
                      "ReadingValue": 210.0
                    },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 55
                    },
                    {
                      "SubZone": "WholeZone",
                      "ReadingType": "O2",
                      "ReadingValue": 500
                    },
                    {
                      "SubZone": "WholeZone",
                      "ReadingType": "Vacuum",
                      "ReadingValue": 300
                    },
                    {
                      "SubZone": "WholeZone",
                      "ReadingType": "VacuumHoldTime",
                      "ReadingValue": 7.0
                    },
                    {
                      "SubZone": "WholeZone",
                      "ReadingType": "ConvectionRate",
                      "ReadingValue": 270.0
                    }
                 ]
               },
               {
                 "Zone": {
                   "ReflowZoneType": "Cool",
                   "StageSequence": 1,
                   "StageName": "Zone1",
                   "StageType": "Work"
                 },
                 "Setpoints": [
                   {
                     "SubZone": "WholeZone",
                     "SetpointType": "Temperature",
                     "Setpoint": 160.0
                   }
                 ],
                 "Readings": [
                   {
                     "SubZone": "WholeZone",
                     "ReadingType": "Temperature",
                     "ReadingValue": 160.0
                   }
                 ]
               },
               {
                 "Zone": {
                   "ReflowZoneType": "Cool",
                   "StageSequence": 2,
                   "StageName": "Zone2",
                   "StageType": "Work"
                 },
                 "Setpoints": [
                   {
                     "SubZone": "WholeZone",
                     "SetpointType": "Temperature",
                     "Setpoint": 60.0
                   }
                 ],
                 "Readings": [
                   {
                     "SubZone": "WholeZone",
                     "ReadingType": "Temperature",
                     "ReadingValue": 46.5
                   }
                 ]
               },
               {
                 "Zone": {
                   "ReflowZoneType": "Cool",
                   "StageSequence": 3,
                   "StageName": "Zone3",
                   "StageType": "Work"
                 },
                 "Setpoints": [
                   {
                     "SubZone": "WholeZone",
                     "SetpointType": "Temperature",
                     "Setpoint": 40.0
                   }
                 ],
                 "Readings": [
                   {
                     "SubZone": "WholeZone",
                     "ReadingType": "Temperature",
                     "ReadingValue": 29.3
                   }
                 ]
               },
               {
                 "Zone": {
                   "ReflowZoneType": "Cool",
                   "StageSequence": 4,
                   "StageName": "Zone4",
                   "StageType": "Work"
                 },
                 "Setpoints": [
                   {
                     "SubZone": "WholeZone",
                     "SetpointType": "Temperature",
                     "Setpoint": 40.0
                   }
                 ],
                 "Readings": [
                   {
                     "SubZone": "WholeZone",
                     "ReadingType": "Temperature",
                     "ReadingValue": 27.7
                   }
                 ]
               }
             ]
            """;

        public const string ZoneData_C = """
            [
              {
                "Zone": {
                  "ReflowZoneType": "PreHeat",
                  "StageSequence": 1,
                  "StageName": "Zone1",
                  "StageType": "Work"
                },
                "Setpoints": [
                  {
                    "SubZone": "Bottom",
                    "SetpointType": "Temperature",
                    "Setpoint": 115.0
                  },
                  {
                    "SubZone": "Top",
                    "SetpointType": "Temperature",
                    "Setpoint": 135.0
                  },
                  {
                    "SubZone": "WholeZone",
                    "SetpointType": "Temperature",
                    "Setpoint": 125.0
                  }
                ],
                "Readings": [
                  {
                    "SubZone": "Bottom",
                    "ReadingType": "Temperature",
                    "ReadingValue": 126.4
                  },
                  {
                    "SubZone": "Top",
                    "ReadingType": "Temperature",
                    "ReadingValue": 126.0
                  },
                  {
                    "SubZone": "WholeZone",
                    "ReadingType": "Temperature",
                    "ReadingValue": 119.9
                  },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "Power",
                      "ReadingValue": 115.0
                    },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 30.0
                    },
                    {
                      "SubZone": "Top",
                      "ReadingType": "Power",
                      "ReadingValue": 220.0
                    },
                    {
                      "SubZone": "Top",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 30.0
                    }
                ]
              },
              {
                "Zone": {
                  "ReflowZoneType": "PreHeat",
                  "StageSequence": 2,
                  "StageName": "Zone2",
                  "StageType": "Work"
                },
                "Setpoints": [
                  {
                    "SubZone": "Bottom",
                    "SetpointType": "Temperature",
                    "Setpoint": 135.0
                  },
                  {
                    "SubZone": "Top",
                    "SetpointType": "Temperature",
                    "Setpoint": 155.0
                  },
                  {
                    "SubZone": "WholeZone",
                    "SetpointType": "Temperature",
                    "Setpoint": 145.0
                  }
                ],
                "Readings": [
                  {
                    "SubZone": "Bottom",
                    "ReadingType": "Temperature",
                    "ReadingValue": 145.5
                  },
                  {
                    "SubZone": "Top",
                    "ReadingType": "Temperature",
                    "ReadingValue": 145.3
                  },
                  {
                    "SubZone": "WholeZone",
                    "ReadingType": "Temperature",
                    "ReadingValue": 139.8
                  },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "Power",
                      "ReadingValue": 195.0
                    },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 45.0
                    },
                    {
                      "SubZone": "Top",
                      "ReadingType": "Power",
                      "ReadingValue": 220.0
                    },
                    {
                      "SubZone": "Top",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 55.0
                    }
                ]
              },
              {
                "Zone": {
                  "ReflowZoneType": "PreHeat",
                  "StageSequence": 3,
                  "StageName": "Zone3",
                  "StageType": "Work"
                },
                "Setpoints": [
                  {
                    "SubZone": "Bottom",
                    "SetpointType": "Temperature",
                    "Setpoint": 150.0
                  },
                  {
                    "SubZone": "Top",
                    "SetpointType": "Temperature",
                    "Setpoint": 170.0
                  },
                  {
                    "SubZone": "WholeZone",
                    "SetpointType": "Temperature",
                    "Setpoint": 160.0
                  }
                ],
                "Readings": [
                  {
                    "SubZone": "Bottom",
                    "ReadingType": "Temperature",
                    "ReadingValue": 162.6
                  },
                  {
                    "SubZone": "Top",
                    "ReadingType": "Temperature",
                    "ReadingValue": 160.8
                  },
                  {
                    "SubZone": "WholeZone",
                    "ReadingType": "Temperature",
                    "ReadingValue": 160.1
                  },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "Power",
                      "ReadingValue": 210.0
                    },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 50.0
                    },
                    {
                      "SubZone": "Top",
                      "ReadingType": "Power",
                      "ReadingValue": 220.0
                    },
                    {
                      "SubZone": "Top",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 55.0
                    }
                ]
              },
              {
                "Zone": {
                  "ReflowZoneType": "PreHeat",
                  "StageSequence": 4,
                  "StageName": "Zone4",
                  "StageType": "Work"
                },
                "Setpoints": [
                  {
                    "SubZone": "Bottom",
                    "SetpointType": "Temperature",
                    "Setpoint": 170.0
                  },
                  {
                    "SubZone": "Top",
                    "SetpointType": "Temperature",
                    "Setpoint": 190.0
                  },
                  {
                    "SubZone": "WholeZone",
                    "SetpointType": "Temperature",
                    "Setpoint": 180.0
                  }
                ],
                "Readings": [
                  {
                    "SubZone": "Bottom",
                    "ReadingType": "Temperature",
                    "ReadingValue": 180.3
                  },
                  {
                    "SubZone": "Top",
                    "ReadingType": "Temperature",
                    "ReadingValue": 180.1
                  },
                  {
                    "SubZone": "WholeZone",
                    "ReadingType": "Temperature",
                    "ReadingValue": 175.8
                  },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "Power",
                      "ReadingValue": 220.0
                    },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 55.0
                    },
                    {
                      "SubZone": "Top",
                      "ReadingType": "Power",
                      "ReadingValue": 220.0
                    },
                    {
                      "SubZone": "Top",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 55.0
                    }
                ]
              },
              {
                "Zone": {
                  "ReflowZoneType": "PreHeat",
                  "StageSequence": 5,
                  "StageName": "Zone5",
                  "StageType": "Work"
                },
                "Setpoints": [
                  {
                    "SubZone": "Bottom",
                    "SetpointType": "Temperature",
                    "Setpoint": 180.0
                  },
                  {
                    "SubZone": "Top",
                    "SetpointType": "Temperature",
                    "Setpoint": 200.0
                  },
                  {
                    "SubZone": "WholeZone",
                    "SetpointType": "Temperature",
                    "Setpoint": 190.0
                  }
                ],
                "Readings": [
                  {
                    "SubZone": "Bottom",
                    "ReadingType": "Temperature",
                    "ReadingValue": 190.6
                  },
                  {
                    "SubZone": "Top",
                    "ReadingType": "Temperature",
                    "ReadingValue": 190.1
                  },
                  {
                    "SubZone": "WholeZone",
                    "ReadingType": "Temperature",
                    "ReadingValue": 185.8
                  },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "Power",
                      "ReadingValue": 220.0
                    },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 55.0
                    },
                    {
                      "SubZone": "Top",
                      "ReadingType": "Power",
                      "ReadingValue": 220.0
                    },
                    {
                      "SubZone": "Top",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 55.0
                    }
                ]
              },
              {
                "Zone": {
                  "ReflowZoneType": "PreHeat",
                  "StageSequence": 6,
                  "StageName": "Zone6",
                  "StageType": "Work"
                },
                "Setpoints": [
                  {
                    "SubZone": "Bottom",
                    "SetpointType": "Temperature",
                    "Setpoint": 200.0
                  },
                  {
                    "SubZone": "Top",
                    "SetpointType": "Temperature",
                    "Setpoint": 210.0
                  },
                  {
                    "SubZone": "WholeZone",
                    "SetpointType": "Temperature",
                    "Setpoint": 205.0
                  }
                ],
                "Readings": [
                  {
                    "SubZone": "Bottom",
                    "ReadingType": "Temperature",
                    "ReadingValue": 206.3
                  },
                  {
                    "SubZone": "Top",
                    "ReadingType": "Temperature",
                    "ReadingValue": 205.6
                  },
                  {
                    "SubZone": "WholeZone",
                    "ReadingType": "Temperature",
                    "ReadingValue": 202.1
                  },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "Power",
                      "ReadingValue": 220.0
                    },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 55.0
                    },
                    {
                      "SubZone": "Top",
                      "ReadingType": "Power",
                      "ReadingValue": 220.0
                    },
                    {
                      "SubZone": "Top",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 55.0
                    }
                ]
              },
              {
                "Zone": {
                  "ReflowZoneType": "PreHeat",
                  "StageSequence": 7,
                  "StageName": "Zone7",
                  "StageType": "Work"
                },
                "Setpoints": [
                  {
                    "SubZone": "Bottom",
                    "SetpointType": "Temperature",
                    "Setpoint": 225.0
                  },
                  {
                    "SubZone": "Top",
                    "SetpointType": "Temperature",
                    "Setpoint": 235.0
                  },
                  {
                    "SubZone": "WholeZone",
                    "SetpointType": "Temperature",
                    "Setpoint": 220.0
                  }
                ],
                "Readings": [
                  {
                    "SubZone": "Bottom",
                    "ReadingType": "Temperature",
                    "ReadingValue": 230.6
                  },
                  {
                    "SubZone": "Top",
                    "ReadingType": "Temperature",
                    "ReadingValue": 230.6
                  },
                  {
                    "SubZone": "WholeZone",
                    "ReadingType": "Temperature",
                    "ReadingValue": 226.3
                  },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "Power",
                      "ReadingValue": 220.0
                    },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 55.0
                    },
                    {
                      "SubZone": "Top",
                      "ReadingType": "Power",
                      "ReadingValue": 220.0
                    },
                    {
                      "SubZone": "Top",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 55.0
                    }
                ]
              },
              {
                "Zone": {
                  "ReflowZoneType": "Reflow",
                  "StageSequence": 1,
                  "StageName": "Zone1",
                  "StageType": "Work"
                },
                "Setpoints": [
                  {
                    "SubZone": "Bottom",
                    "SetpointType": "Temperature",
                    "Setpoint": 263.0
                  },
                  {
                    "SubZone": "Top",
                    "SetpointType": "Temperature",
                    "Setpoint": 273.0
                  },
                  {
                    "SubZone": "WholeZone",
                    "SetpointType": "Temperature",
                    "Setpoint": 262.0
                  },
            	    {
            	      "SubZone": "WholeZone",
            	      "SetpointType": "O2",
            	      "Setpoint": 500.0
            	    },
            	    {
            	      "SubZone": "WholeZone",
            	      "SetpointType": "Vacuum",
            	      "Setpoint": 225.0
            	    },
            	    {
            	      "SubZone": "WholeZone",
            	      "SetpointType": "VacuumHoldTime",
            	      "Setpoint": 5.0
            	    }
                ],
                "Readings": [
                  {
                    "SubZone": "Bottom",
                    "ReadingType": "Temperature",
                    "ReadingValue": 267.8
                  },
                  {
                    "SubZone": "Top",
                    "ReadingType": "Temperature",
                    "ReadingValue": 268.0
                  },
                  {
                    "SubZone": "WholeZone",
                    "ReadingType": "Temperature",
                    "ReadingValue": 256.1
                  },
                {
                  "SubZone": "Bottom",
                  "ReadingType": "PowerLevel",
                  "ReadingValue": 65.0
                },
                {
                  "SubZone": "WholeZone",
                  "ReadingType": "O2",
                  "ReadingValue": 498.0
                },
                {
                  "SubZone": "WholeZone",
                  "ReadingType": "Vacuum",
                  "ReadingValue": 224.0
                },
                {
                  "SubZone": "WholeZone",
                  "ReadingType": "VacuumHoldTime",
                  "ReadingValue": 5.0
                },
                {
                  "SubZone": "WholeZone",
                  "ReadingType": "ConvectionRate",
                  "ReadingValue": 250.0
                }
                ]
              },
              {
                "Zone": {
                  "ReflowZoneType": "Reflow",
                  "StageSequence": 2,
                  "StageName": "Zone2",
                  "StageType": "Work"
                },
                "Setpoints": [
                  {
                    "SubZone": "Bottom",
                    "SetpointType": "Temperature",
                    "Setpoint": 263.0
                  },
                  {
                    "SubZone": "Top",
                    "SetpointType": "Temperature",
                    "Setpoint": 273.0
                  },
                  {
                    "SubZone": "WholeZone",
                    "SetpointType": "Temperature",
                    "Setpoint": 262.0
                  },
                    {
                      "SubZone": "WholeZone",
                      "SetpointType": "O2",
                      "Setpoint": 500.0
                    },
                    {
                      "SubZone": "WholeZone",
                      "SetpointType": "Vacuum",
                      "Setpoint": 300
                    },
                    {
                      "SubZone": "WholeZone",
                      "SetpointType": "VacuumHoldTime",
                      "Setpoint": 7
                    }
                ],
                "Readings": [
                  {
                    "SubZone": "Bottom",
                    "ReadingType": "Temperature",
                    "ReadingValue": 268.2
                  },
                  {
                    "SubZone": "Top",
                    "ReadingType": "Temperature",
                    "ReadingValue": 269.3
                  },
                  {
                    "SubZone": "WholeZone",
                    "ReadingType": "Temperature",
                    "ReadingValue": 261.0
                  },
                    {
                      "SubZone": "Top",
                      "ReadingType": "Power",
                      "ReadingValue": 230.0
                    },
                    {
                      "SubZone": "Top",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 75.0
                    },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "Power",
                      "ReadingValue": 220.0
                    },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 67
                    },
                    {
                      "SubZone": "WholeZone",
                      "ReadingType": "O2",
                      "ReadingValue": 500
                    },
                    {
                      "SubZone": "WholeZone",
                      "ReadingType": "Vacuum",
                      "ReadingValue": 300
                    },
                    {
                      "SubZone": "WholeZone",
                      "ReadingType": "VacuumHoldTime",
                      "ReadingValue": 7.0
                    },
                    {
                      "SubZone": "WholeZone",
                      "ReadingType": "ConvectionRate",
                      "ReadingValue": 270.0
                    }
                ]
              },
              {
                "Zone": {
                  "ReflowZoneType": "Reflow",
                  "StageSequence": 3,
                  "StageName": "Zone3",
                  "StageType": "Work"
                },
                "Setpoints": [
                  {
                    "SubZone": "Bottom",
                    "SetpointType": "Temperature",
                    "Setpoint": 225.0
                  },
                  {
                    "SubZone": "Top",
                    "SetpointType": "Temperature",
                    "Setpoint": 235.0
                  },
                  {
                    "SubZone": "WholeZone",
                    "SetpointType": "Temperature",
                    "Setpoint": 230.0
                  },
                    {
                      "SubZone": "WholeZone",
                      "SetpointType": "O2",
                      "Setpoint": 500.0
                    },
                    {
                      "SubZone": "WholeZone",
                      "SetpointType": "Vacuum",
                      "Setpoint": 300
                    },
                    {
                      "SubZone": "WholeZone",
                      "SetpointType": "VacuumHoldTime",
                      "Setpoint": 7
                    }
                ],
                "Readings": [
                  {
                    "SubZone": "Bottom",
                    "ReadingType": "Temperature",
                    "ReadingValue": 229.8
                  },
                  {
                    "SubZone": "Top",
                    "ReadingType": "Temperature",
                    "ReadingValue": 230.1
                  },
                  {
                    "SubZone": "WholeZone",
                    "ReadingType": "Temperature",
                    "ReadingValue": 209.1
                  },
                    {
                      "SubZone": "Top",
                      "ReadingType": "Power",
                      "ReadingValue": 211.0
                    },
                    {
                      "SubZone": "Top",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 55.0
                    },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "Power",
                      "ReadingValue": 210.0
                    },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 55
                    },
                    {
                      "SubZone": "WholeZone",
                      "ReadingType": "O2",
                      "ReadingValue": 500
                    },
                    {
                      "SubZone": "WholeZone",
                      "ReadingType": "Vacuum",
                      "ReadingValue": 300
                    },
                    {
                      "SubZone": "WholeZone",
                      "ReadingType": "VacuumHoldTime",
                      "ReadingValue": 7.0
                    },
                    {
                      "SubZone": "WholeZone",
                      "ReadingType": "ConvectionRate",
                      "ReadingValue": 270.0
                    }
                ]
              },
              {
                "Zone": {
                  "ReflowZoneType": "Cool",
                  "StageSequence": 1,
                  "StageName": "Zone1",
                  "StageType": "Work"
                },
                "Setpoints": [
                  {
                    "SubZone": "WholeZone",
                    "SetpointType": "Temperature",
                    "Setpoint": 160.0
                  }
                ],
                "Readings": [
                  {
                    "SubZone": "WholeZone",
                    "ReadingType": "Temperature",
                    "ReadingValue": 160.3
                  }
                ]
              },
              {
                "Zone": {
                  "ReflowZoneType": "Cool",
                  "StageSequence": 2,
                  "StageName": "Zone2",
                  "StageType": "Work"
                },
                "Setpoints": [
                  {
                    "SubZone": "WholeZone",
                    "SetpointType": "Temperature",
                    "Setpoint": 60.0
                  }
                ],
                "Readings": [
                  {
                    "SubZone": "WholeZone",
                    "ReadingType": "Temperature",
                    "ReadingValue": 46.5
                  }
                ]
              },
              {
                "Zone": {
                  "ReflowZoneType": "Cool",
                  "StageSequence": 3,
                  "StageName": "Zone3",
                  "StageType": "Work"
                },
                "Setpoints": [
                  {
                    "SubZone": "WholeZone",
                    "SetpointType": "Temperature",
                    "Setpoint": 40.0
                  }
                ],
                "Readings": [
                  {
                    "SubZone": "WholeZone",
                    "ReadingType": "Temperature",
                    "ReadingValue": 29.3
                  }
                ]
              },
              {
                "Zone": {
                  "ReflowZoneType": "Cool",
                  "StageSequence": 4,
                  "StageName": "Zone4",
                  "StageType": "Work"
                },
                "Setpoints": [
                  {
                    "SubZone": "WholeZone",
                    "SetpointType": "Temperature",
                    "Setpoint": 40.0
                  }
                ],
                "Readings": [
                  {
                    "SubZone": "WholeZone",
                    "ReadingType": "Temperature",
                    "ReadingValue": 27.7
                  }
                ]
              }
            ]
            """;

        public const string ZoneData_D = """
            [
              {
                "Zone": {
                  "ReflowZoneType": "PreHeat",
                  "StageSequence": 1,
                  "StageName": "Zone1",
                  "StageType": "Work"
                },
                "Setpoints": [
                  {
                    "SubZone": "Bottom",
                    "SetpointType": "Temperature",
                    "Setpoint": 115.0
                  },
                  {
                    "SubZone": "Top",
                    "SetpointType": "Temperature",
                    "Setpoint": 135.0
                  },
                  {
                    "SubZone": "WholeZone",
                    "SetpointType": "Temperature",
                    "Setpoint": 125.0
                  }
                ],
                "Readings": [
                  {
                    "SubZone": "Bottom",
                    "ReadingType": "Temperature",
                    "ReadingValue": 126.4
                  },
                  {
                    "SubZone": "Top",
                    "ReadingType": "Temperature",
                    "ReadingValue": 126.0
                  },
                  {
                    "SubZone": "WholeZone",
                    "ReadingType": "Temperature",
                    "ReadingValue": 119.8
                  },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "Power",
                      "ReadingValue": 115.0
                    },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 30.0
                    },
                    {
                      "SubZone": "Top",
                      "ReadingType": "Power",
                      "ReadingValue": 220.0
                    },
                    {
                      "SubZone": "Top",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 30.0
                    }
                ]
              },
              {
                "Zone": {
                  "ReflowZoneType": "PreHeat",
                  "StageSequence": 2,
                  "StageName": "Zone2",
                  "StageType": "Work"
                },
                "Setpoints": [
                  {
                    "SubZone": "Bottom",
                    "SetpointType": "Temperature",
                    "Setpoint": 135.0
                  },
                  {
                    "SubZone": "Top",
                    "SetpointType": "Temperature",
                    "Setpoint": 155.0
                  },
                  {
                    "SubZone": "WholeZone",
                    "SetpointType": "Temperature",
                    "Setpoint": 145.0
                  }
                ],
                "Readings": [
                  {
                    "SubZone": "Bottom",
                    "ReadingType": "Temperature",
                    "ReadingValue": 145.3
                  },
                  {
                    "SubZone": "Top",
                    "ReadingType": "Temperature",
                    "ReadingValue": 145.3
                  },
                  {
                    "SubZone": "WholeZone",
                    "ReadingType": "Temperature",
                    "ReadingValue": 139.8
                  },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "Power",
                      "ReadingValue": 195.0
                    },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 45.0
                    },
                    {
                      "SubZone": "Top",
                      "ReadingType": "Power",
                      "ReadingValue": 220.0
                    },
                    {
                      "SubZone": "Top",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 55.0
                    }
                ]
              },
              {
                "Zone": {
                  "ReflowZoneType": "PreHeat",
                  "StageSequence": 3,
                  "StageName": "Zone3",
                  "StageType": "Work"
                },
                "Setpoints": [
                  {
                    "SubZone": "Bottom",
                    "SetpointType": "Temperature",
                    "Setpoint": 150.0
                  },
                  {
                    "SubZone": "Top",
                    "SetpointType": "Temperature",
                    "Setpoint": 170.0
                  },
                  {
                    "SubZone": "WholeZone",
                    "SetpointType": "Temperature",
                    "Setpoint": 160.0
                  }
                ],
                "Readings": [
                  {
                    "SubZone": "Bottom",
                    "ReadingType": "Temperature",
                    "ReadingValue": 162.6
                  },
                  {
                    "SubZone": "Top",
                    "ReadingType": "Temperature",
                    "ReadingValue": 160.8
                  },
                  {
                    "SubZone": "WholeZone",
                    "ReadingType": "Temperature",
                    "ReadingValue": 160.1
                  },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "Power",
                      "ReadingValue": 210.0
                    },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 50.0
                    },
                    {
                      "SubZone": "Top",
                      "ReadingType": "Power",
                      "ReadingValue": 220.0
                    },
                    {
                      "SubZone": "Top",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 55.0
                    }
                ]
              },
              {
                "Zone": {
                  "ReflowZoneType": "PreHeat",
                  "StageSequence": 4,
                  "StageName": "Zone4",
                  "StageType": "Work"
                },
                "Setpoints": [
                  {
                    "SubZone": "Bottom",
                    "SetpointType": "Temperature",
                    "Setpoint": 170.0
                  },
                  {
                    "SubZone": "Top",
                    "SetpointType": "Temperature",
                    "Setpoint": 190.0
                  },
                  {
                    "SubZone": "WholeZone",
                    "SetpointType": "Temperature",
                    "Setpoint": 180.0
                  }
                ],
                "Readings": [
                  {
                    "SubZone": "Bottom",
                    "ReadingType": "Temperature",
                    "ReadingValue": 180.3
                  },
                  {
                    "SubZone": "Top",
                    "ReadingType": "Temperature",
                    "ReadingValue": 180.0
                  },
                  {
                    "SubZone": "WholeZone",
                    "ReadingType": "Temperature",
                    "ReadingValue": 176.0
                  },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "Power",
                      "ReadingValue": 220.0
                    },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 55.0
                    },
                    {
                      "SubZone": "Top",
                      "ReadingType": "Power",
                      "ReadingValue": 220.0
                    },
                    {
                      "SubZone": "Top",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 55.0
                    }
                ]
              },
              {
                "Zone": {
                  "ReflowZoneType": "PreHeat",
                  "StageSequence": 5,
                  "StageName": "Zone5",
                  "StageType": "Work"
                },
                "Setpoints": [
                  {
                    "SubZone": "Bottom",
                    "SetpointType": "Temperature",
                    "Setpoint": 180.0
                  },
                  {
                    "SubZone": "Top",
                    "SetpointType": "Temperature",
                    "Setpoint": 200.0
                  },
                  {
                    "SubZone": "WholeZone",
                    "SetpointType": "Temperature",
                    "Setpoint": 190.0
                  }
                ],
                "Readings": [
                  {
                    "SubZone": "Bottom",
                    "ReadingType": "Temperature",
                    "ReadingValue": 190.6
                  },
                  {
                    "SubZone": "Top",
                    "ReadingType": "Temperature",
                    "ReadingValue": 190.3
                  },
                  {
                    "SubZone": "WholeZone",
                    "ReadingType": "Temperature",
                    "ReadingValue": 186.0
                  },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "Power",
                      "ReadingValue": 220.0
                    },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 55.0
                    },
                    {
                      "SubZone": "Top",
                      "ReadingType": "Power",
                      "ReadingValue": 220.0
                    },
                    {
                      "SubZone": "Top",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 55.0
                    }
                ]
              },
              {
                "Zone": {
                  "ReflowZoneType": "PreHeat",
                  "StageSequence": 6,
                  "StageName": "Zone6",
                  "StageType": "Work"
                },
                "Setpoints": [
                  {
                    "SubZone": "Bottom",
                    "SetpointType": "Temperature",
                    "Setpoint": 200.0
                  },
                  {
                    "SubZone": "Top",
                    "SetpointType": "Temperature",
                    "Setpoint": 210.0
                  },
                  {
                    "SubZone": "WholeZone",
                    "SetpointType": "Temperature",
                    "Setpoint": 205.0
                  }
                ],
                "Readings": [
                  {
                    "SubZone": "Bottom",
                    "ReadingType": "Temperature",
                    "ReadingValue": 206.3
                  },
                  {
                    "SubZone": "Top",
                    "ReadingType": "Temperature",
                    "ReadingValue": 205.6
                  },
                  {
                    "SubZone": "WholeZone",
                    "ReadingType": "Temperature",
                    "ReadingValue": 202.1
                  },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "Power",
                      "ReadingValue": 220.0
                    },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 55.0
                    },
                    {
                      "SubZone": "Top",
                      "ReadingType": "Power",
                      "ReadingValue": 220.0
                    },
                    {
                      "SubZone": "Top",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 55.0
                    }
                ]
              },
              {
                "Zone": {
                  "ReflowZoneType": "PreHeat",
                  "StageSequence": 7,
                  "StageName": "Zone7",
                  "StageType": "Work"
                },
                "Setpoints": [
                  {
                    "SubZone": "Bottom",
                    "SetpointType": "Temperature",
                    "Setpoint": 225.0
                  },
                  {
                    "SubZone": "Top",
                    "SetpointType": "Temperature",
                    "Setpoint": 235.0
                  },
                  {
                    "SubZone": "WholeZone",
                    "SetpointType": "Temperature",
                    "Setpoint": 220.0
                  }
                ],
                "Readings": [
                  {
                    "SubZone": "Bottom",
                    "ReadingType": "Temperature",
                    "ReadingValue": 230.8
                  },
                  {
                    "SubZone": "Top",
                    "ReadingType": "Temperature",
                    "ReadingValue": 230.6
                  },
                  {
                    "SubZone": "WholeZone",
                    "ReadingType": "Temperature",
                    "ReadingValue": 226.0
                  },
            	    {
            	      "SubZone": "Bottom",
            	      "ReadingType": "Power",
            	      "ReadingValue": 220.0
            	    },
            	    {
            	      "SubZone": "Bottom",
            	      "ReadingType": "PowerLevel",
            	      "ReadingValue": 55.0
            	    },
            	    {
            	      "SubZone": "Top",
            	      "ReadingType": "Power",
            	      "ReadingValue": 220.0
            	    },
            	    {
            	      "SubZone": "Top",
            	      "ReadingType": "PowerLevel",
            	      "ReadingValue": 55.0
            	    }
                ]
              },
              {
                "Zone": {
                  "ReflowZoneType": "Reflow",
                  "StageSequence": 1,
                  "StageName": "Zone1",
                  "StageType": "Work"
                },
                "Setpoints": [
                  {
                    "SubZone": "Bottom",
                    "SetpointType": "Temperature",
                    "Setpoint": 263.0
                  },
                  {
                    "SubZone": "Top",
                    "SetpointType": "Temperature",
                    "Setpoint": 273.0
                  },
                  {
                    "SubZone": "WholeZone",
                    "SetpointType": "Temperature",
                    "Setpoint": 262.0
                  },
                    {
                      "SubZone": "WholeZone",
                      "SetpointType": "O2",
                      "Setpoint": 500.0
                    },
                    {
                      "SubZone": "WholeZone",
                      "SetpointType": "Vacuum",
                      "Setpoint": 225.0
                    },
                    {
                      "SubZone": "WholeZone",
                      "SetpointType": "VacuumHoldTime",
                      "Setpoint": 5.0
                    }
                ],
                "Readings": [
                  {
                    "SubZone": "Bottom",
                    "ReadingType": "Temperature",
                    "ReadingValue": 268.2
                  },
                  {
                    "SubZone": "Top",
                    "ReadingType": "Temperature",
                    "ReadingValue": 268.2
                  },
                  {
                    "SubZone": "WholeZone",
                    "ReadingType": "Temperature",
                    "ReadingValue": 256.2
                  },
                    {
                      "SubZone": "Top",
                      "ReadingType": "Power",
                      "ReadingValue": 230.0
                    },
                    {
                      "SubZone": "Top",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 75.0
                    },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "Power",
                      "ReadingValue": 220.0
                    },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 65.0
                    },
                    {
                      "SubZone": "WholeZone",
                      "ReadingType": "O2",
                      "ReadingValue": 498.0
                    },
                    {
                      "SubZone": "WholeZone",
                      "ReadingType": "Vacuum",
                      "ReadingValue": 224.0
                    },
                    {
                      "SubZone": "WholeZone",
                      "ReadingType": "VacuumHoldTime",
                      "ReadingValue": 5.0
                    },
                    {
                      "SubZone": "WholeZone",
                      "ReadingType": "ConvectionRate",
                      "ReadingValue": 250.0
                    }
                ]
              },
              {
                "Zone": {
                  "ReflowZoneType": "Reflow",
                  "StageSequence": 2,
                  "StageName": "Zone2",
                  "StageType": "Work"
                },
                "Setpoints": [
                  {
                    "SubZone": "Bottom",
                    "SetpointType": "Temperature",
                    "Setpoint": 263.0
                  },
                  {
                    "SubZone": "Top",
                    "SetpointType": "Temperature",
                    "Setpoint": 273.0
                  },
                  {
                    "SubZone": "WholeZone",
                    "SetpointType": "Temperature",
                    "Setpoint": 262.0
                  },
                    {
                      "SubZone": "WholeZone",
                      "SetpointType": "O2",
                      "Setpoint": 500.0
                    },
                    {
                      "SubZone": "WholeZone",
                      "SetpointType": "Vacuum",
                      "Setpoint": 300
                    },
                    {
                      "SubZone": "WholeZone",
                      "SetpointType": "VacuumHoldTime",
                      "Setpoint": 7
                    }
                ],
                "Readings": [
                  {
                    "SubZone": "Bottom",
                    "ReadingType": "Temperature",
                    "ReadingValue": 268.1
                  },
                  {
                    "SubZone": "Top",
                    "ReadingType": "Temperature",
                    "ReadingValue": 269.5
                  },
                  {
                    "SubZone": "WholeZone",
                    "ReadingType": "Temperature",
                    "ReadingValue": 262.7
                  },
                    {
                      "SubZone": "Top",
                      "ReadingType": "Power",
                      "ReadingValue": 230.0
                    },
                    {
                      "SubZone": "Top",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 75.0
                    },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "Power",
                      "ReadingValue": 220.0
                    },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 67
                    },
                    {
                      "SubZone": "WholeZone",
                      "ReadingType": "O2",
                      "ReadingValue": 500
                    },
                    {
                      "SubZone": "WholeZone",
                      "ReadingType": "Vacuum",
                      "ReadingValue": 300
                    },
                    {
                      "SubZone": "WholeZone",
                      "ReadingType": "VacuumHoldTime",
                      "ReadingValue": 7.0
                    },
                    {
                      "SubZone": "WholeZone",
                      "ReadingType": "ConvectionRate",
                      "ReadingValue": 270.0
                    }
                ]
              },
              {
                "Zone": {
                  "ReflowZoneType": "Reflow",
                  "StageSequence": 3,
                  "StageName": "Zone3",
                  "StageType": "Work"
                },
                "Setpoints": [
                  {
                    "SubZone": "Bottom",
                    "SetpointType": "Temperature",
                    "Setpoint": 225.0
                  },
                  {
                    "SubZone": "Top",
                    "SetpointType": "Temperature",
                    "Setpoint": 235.0
                  },
                  {
                    "SubZone": "WholeZone",
                    "SetpointType": "Temperature",
                    "Setpoint": 230.0
                  },
                    {
                      "SubZone": "WholeZone",
                      "SetpointType": "O2",
                      "Setpoint": 500.0
                    },
                    {
                      "SubZone": "WholeZone",
                      "SetpointType": "Vacuum",
                      "Setpoint": 300
                    },
                    {
                      "SubZone": "WholeZone",
                      "SetpointType": "VacuumHoldTime",
                      "Setpoint": 7
                    }
                ],
                "Readings": [
                  {
                    "SubZone": "Bottom",
                    "ReadingType": "Temperature",
                    "ReadingValue": 230.0
                  },
                  {
                    "SubZone": "Top",
                    "ReadingType": "Temperature",
                    "ReadingValue": 230.1
                  },
                  {
                    "SubZone": "WholeZone",
                    "ReadingType": "Temperature",
                    "ReadingValue": 212.3
                  },
                    {
                      "SubZone": "Top",
                      "ReadingType": "Power",
                      "ReadingValue": 211.0
                    },
                    {
                      "SubZone": "Top",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 55.0
                    },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "Power",
                      "ReadingValue": 210.0
                    },
                    {
                      "SubZone": "Bottom",
                      "ReadingType": "PowerLevel",
                      "ReadingValue": 55
                    },
                    {
                      "SubZone": "WholeZone",
                      "ReadingType": "O2",
                      "ReadingValue": 500
                    },
                    {
                      "SubZone": "WholeZone",
                      "ReadingType": "Vacuum",
                      "ReadingValue": 300
                    },
                    {
                      "SubZone": "WholeZone",
                      "ReadingType": "VacuumHoldTime",
                      "ReadingValue": 7.0
                    },
                    {
                      "SubZone": "WholeZone",
                      "ReadingType": "ConvectionRate",
                      "ReadingValue": 270.0
                    }
                ]
              },
              {
                "Zone": {
                  "ReflowZoneType": "Cool",
                  "StageSequence": 1,
                  "StageName": "Zone1",
                  "StageType": "Work"
                },
                "Setpoints": [
                  {
                    "SubZone": "WholeZone",
                    "SetpointType": "Temperature",
                    "Setpoint": 160.0
                  }
                ],
                "Readings": [
                  {
                    "SubZone": "WholeZone",
                    "ReadingType": "Temperature",
                    "ReadingValue": 160.1
                  }
                ]
              },
              {
                "Zone": {
                  "ReflowZoneType": "Cool",
                  "StageSequence": 2,
                  "StageName": "Zone2",
                  "StageType": "Work"
                },
                "Setpoints": [
                  {
                    "SubZone": "WholeZone",
                    "SetpointType": "Temperature",
                    "Setpoint": 60.0
                  }
                ],
                "Readings": [
                  {
                    "SubZone": "WholeZone",
                    "ReadingType": "Temperature",
                    "ReadingValue": 46.5
                  }
                ]
              },
              {
                "Zone": {
                  "ReflowZoneType": "Cool",
                  "StageSequence": 3,
                  "StageName": "Zone3",
                  "StageType": "Work"
                },
                "Setpoints": [
                  {
                    "SubZone": "WholeZone",
                    "SetpointType": "Temperature",
                    "Setpoint": 40.0
                  }
                ],
                "Readings": [
                  {
                    "SubZone": "WholeZone",
                    "ReadingType": "Temperature",
                    "ReadingValue": 29.3
                  }
                ]
              },
              {
                "Zone": {
                  "ReflowZoneType": "Cool",
                  "StageSequence": 4,
                  "StageName": "Zone4",
                  "StageType": "Work"
                },
                "Setpoints": [
                  {
                    "SubZone": "WholeZone",
                    "SetpointType": "Temperature",
                    "Setpoint": 40.0
                  }
                ],
                "Readings": [
                  {
                    "SubZone": "WholeZone",
                    "ReadingType": "Temperature",
                    "ReadingValue": 27.7
                  }
                ]
              }
            ]
            """;

        public Events(Dictionary<string, ReflowProcessData> products)
        {
            Products = products;
        }

        public static List<CFX.Structures.SolderReflow.ReflowZoneData> AdjustReadingsRandomly(
            string json,
            double variationFactor = 1.0
        )
        {
            var zones = JsonConvert.DeserializeObject<List<CFX.Structures.SolderReflow.ReflowZoneData>>(json)
                ?? new List<CFX.Structures.SolderReflow.ReflowZoneData>();

            var rand = new Random();

            foreach (var zone in zones)
            {
                foreach (var reading in zone.Readings)
                {
                    switch (reading.ReadingType)
                    {
                        case ReflowReadingType.Temperature:
                        case ReflowReadingType.O2:
                        case ReflowReadingType.ConvectionRate:
                            // ±variationFactor range
                            var delta = (rand.NextDouble() * 2.0 - 1.0) * variationFactor;
                            reading.ReadingValue = reading.ReadingValue + Math.Round(delta, 1);
                            break;

                        case ReflowReadingType.PowerLevel:
                            AdjustPowerLevel(zone, reading, rand, variationFactor);
                            break;

                        case ReflowReadingType.Power:
                            AdjustPower(zone, reading, rand, variationFactor);
                            break;
                    }
                }
            }

            return zones;
        }

        private static void AdjustPowerLevel(
            CFX.Structures.SolderReflow.ReflowZoneData zone,
            dynamic reading,
            Random rand,
            double factor
)
        {
            int delta = (int)(rand.Next(-10, 11) * factor);
            switch (zone.Zone.ReflowZoneType)
            {
                case ReflowZoneType.PreHeat:
                case ReflowZoneType.Cool:
                    reading.ReadingValue = Math.Clamp(reading.ReadingValue + delta, 30, 60);
                    break;

                case ReflowZoneType.Reflow:
                    reading.ReadingValue = Math.Clamp(reading.ReadingValue + delta, 40, 80);
                    break;
            }
        }

        private static void AdjustPower(
            CFX.Structures.SolderReflow.ReflowZoneData zone,
            dynamic reading,
            Random rand,
            double factor
        )
        {
            int delta = (int)(rand.Next(-25, 26) * factor);
            switch (zone.Zone.ReflowZoneType)
            {
                case ReflowZoneType.PreHeat:
                    reading.ReadingValue = Math.Clamp(reading.ReadingValue + delta, 175, 215);
                    break;

                case ReflowZoneType.Reflow:
                    reading.ReadingValue = Math.Clamp(reading.ReadingValue + delta, 200, 400);
                    break;

                case ReflowZoneType.Cool:
                    reading.ReadingValue = 0;
                    break;
            }
        }
    }
}