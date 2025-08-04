using CFX.Structures.SolderReflow;
using Newtonsoft.Json;
using System.Text.Json;

namespace IPCCFXSimulator.Objects
{
    public enum ScenarioReflowData
    {
        Random,
        SolderBalling,
        //Tombstoning,
        //ColdJoint,
        //SolderBridging,
        //Dewetting,
        //HeadInPillow,
        //Voiding,
        //ComponentMisalignment
    }

    public class Events
    {
        public Dictionary<string, ReflowProcessData> Products { get; set; }

        public const string ZoneData_SMT_Product_A = """
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

        public const string ZoneData_SMT_Product_B = """
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

        public const string ZoneData_SMT_Product_C = """
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

        public const string ZoneData_SMT_Product_D = """
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

        public Events(ScenarioReflowData scenario)
        {
            Products = new Dictionary<string, ReflowProcessData>
            {
                {
                    "SMT_Product_A",
                    new ReflowProcessData()
                    {
                        ConveyorSpeed = 100,
                        ConveyorSpeedSetpoint = 100,
                        ZoneData = Scenario(scenario, ZoneData_SMT_Product_A)
                    }
                },
                {
                    "SMT_Product_B",
                    new ReflowProcessData()
                    {
                        ConveyorSpeed = 100,
                        ConveyorSpeedSetpoint = 100,
                        ZoneData = Scenario(scenario, ZoneData_SMT_Product_B)
                    }
                },
                {
                    "SMT_Product_C",
                    new ReflowProcessData()
                    {
                        ConveyorSpeed = 100,
                        ConveyorSpeedSetpoint = 100,
                        ZoneData = Scenario(scenario, ZoneData_SMT_Product_C)
                    }
                },
                {
                    "SMT_Product_D",
                    new ReflowProcessData()
                    {
                        ConveyorSpeed = 100,
                        ConveyorSpeedSetpoint = 100,
                        ZoneData = Scenario(scenario, ZoneData_SMT_Product_D)
                    }
                }
            };
        }

        private static List<CFX.Structures.SolderReflow.ReflowZoneData> Scenario(ScenarioReflowData scenario, string json)
        {
            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            var zones = JsonConvert.DeserializeObject<List<CFX.Structures.SolderReflow.ReflowZoneData>>(json);

            switch (scenario)
            {
                case ScenarioReflowData.Random:
                    return AdjustReadingsRandomly(zones);
                case ScenarioReflowData.SolderBalling:
                    return AdjustReadingsSolderBalling(zones);
                default:
                    throw new NotImplementedException();
            }
        }

        private static List<CFX.Structures.SolderReflow.ReflowZoneData> AdjustReadingsRandomly(List<CFX.Structures.SolderReflow.ReflowZoneData> zones)
        {
            var rand = new Random();
            foreach (var zone in zones)
            {
                foreach (var reading in zone.Readings)
                {
                    switch (reading.ReadingType)
                    {
                        case ReflowReadingType.Temperature:
                            reading.ReadingValue = reading.ReadingValue + Math.Round((rand.NextDouble() * 2.0 - 1.0), 1);
                            break;

                        case ReflowReadingType.PowerLevel:
                            switch (zone.Zone.ReflowZoneType)
                            {
                                case ReflowZoneType.PreHeat:
                                    reading.ReadingValue = Math.Max(30, Math.Min(60, (double)(reading.ReadingValue + rand.Next(-10, 11))));
                                    break;

                                case ReflowZoneType.Reflow:
                                    reading.ReadingValue = Math.Max(40, Math.Min(80, (double)(reading.ReadingValue + rand.Next(-10, 11))));
                                    break;

                                case ReflowZoneType.Cool:
                                    reading.ReadingValue = Math.Max(30, Math.Min(60, (double)(reading.ReadingValue + rand.Next(-10, 11))));
                                    break;
                            }
                            break;

                        case ReflowReadingType.Power:
                            switch (zone.Zone.ReflowZoneType)
                            {
                                case ReflowZoneType.PreHeat:
                                    reading.ReadingValue = Math.Max(175, Math.Min(215, (double)(reading.ReadingValue + rand.Next(-25, 26))));
                                    break;

                                case ReflowZoneType.Reflow:
                                    reading.ReadingValue = Math.Max(200, Math.Min(400, (double)(reading.ReadingValue + rand.Next(-25, 26))));
                                    break;

                                case ReflowZoneType.Cool:
                                    reading.ReadingValue = 0;
                                    break;
                            }
                            break;

                        case ReflowReadingType.O2:
                            reading.ReadingValue = reading.ReadingValue + Math.Round((rand.NextDouble() * 2.0 - 1.0), 1);
                            break;

                        case ReflowReadingType.ConvectionRate:
                            reading.ReadingValue = reading.ReadingValue + Math.Round((rand.NextDouble() * 2.0 - 1.0), 1);
                            break;
                    }
                }
            }

            return zones;
        }

        private static List<CFX.Structures.SolderReflow.ReflowZoneData> AdjustReadingsSolderBalling(List<CFX.Structures.SolderReflow.ReflowZoneData> zones)
        {
            var rand = new Random();
            foreach (var zone in zones)
            {
                foreach (var reading in zone.Readings)
                {
                    switch (reading.ReadingType)
                    {
                        case ReflowReadingType.Temperature:
                            switch (zone.Zone.ReflowZoneType)
                            {
                                case ReflowZoneType.PreHeat:
                                    reading.ReadingValue = rand.Next(180, 200);
                                    break;

                                case ReflowZoneType.Reflow:
                                    reading.ReadingValue = rand.Next(250, 400);
                                    break;

                                case ReflowZoneType.Cool:
                                    reading.ReadingValue = Math.Max(30, Math.Min(60, (double)(reading.ReadingValue + rand.Next(-10, 11))));
                                    break;
                            }
                            break;
                        case ReflowReadingType.PowerLevel:
                            switch (zone.Zone.ReflowZoneType)
                            {
                                case ReflowZoneType.PreHeat:
                                    reading.ReadingValue = Math.Max(40, Math.Min(80, (double)(reading.ReadingValue + rand.Next(-10, 11))));
                                    break;

                                case ReflowZoneType.Reflow:
                                    reading.ReadingValue = Math.Max(60, Math.Min(100, (double)(reading.ReadingValue + rand.Next(-10, 11))));
                                    break;

                                case ReflowZoneType.Cool:
                                    reading.ReadingValue = Math.Max(30, Math.Min(60, (double)(reading.ReadingValue + rand.Next(-10, 11))));
                                    break;
                            }
                            break;

                        case ReflowReadingType.Power:
                            switch (zone.Zone.ReflowZoneType)
                            {
                                case ReflowZoneType.PreHeat:
                                    reading.ReadingValue = Math.Max(200, Math.Min(300, (double)(reading.ReadingValue + rand.Next(-25, 26))));
                                    break;

                                case ReflowZoneType.Reflow:
                                    reading.ReadingValue = Math.Max(300, Math.Min(600, (double)(reading.ReadingValue + rand.Next(-25, 26))));
                                    break;

                                case ReflowZoneType.Cool:
                                    reading.ReadingValue = 0;
                                    break;
                            }
                            break;

                        case ReflowReadingType.O2:
                            reading.ReadingValue = reading.ReadingValue + Math.Round((rand.NextDouble() * 2.0 - 1.0), 1);
                            break;

                        case ReflowReadingType.ConvectionRate:
                            reading.ReadingValue = reading.ReadingValue + Math.Round((rand.NextDouble() * 2.0 - 1.0), 1);
                            break;
                    }
                }
            }

            return zones;
        }
    }
}