module.exports = mongoose => {
  const Match = mongoose.model(
    "matches",
    mongoose.Schema({
      settings: {
        isTeams: {
          type: Boolean
        },
        isPal: {
          type: Boolean
        },
        stageId: {
          type: Number
        },
        stageString: {
          type: String
        }
      },
      metadata: {
        startAt: {
          type: Date
        },
        lastFrame: {
          type: Number
        },
        minutes: {
          type: Number
        },
        game_complete: {
          type: Boolean
        },
        winner: {
          type: String
        }
      },
      players:[{
        playerIndex: {
          type: Number
        },
        characterId: {
          type: Number
        },
        characterColor: {
          type: Number
        },
        code: {
          type: String
        },
        characterString: {
          type: String
        },
        actionCounts: {
          wavedashCount: {
            type: Number
          },
          wavelandCount: {
            type: Number
          },
          airDodgeCount: {
            type: Number
          },
          dashDanceCount: {
            type: Number
          },
          spotDodgeCount: {
            type: Number
          },
          ledgeGrabCount: {
            type: Number
          },
          rollCount: {
            type: Number
          }
        },
        conversions: [{
          playerIndex: {
            type: Number
          },
          opponentIndex: {
            type: Number
          },
          startFrame: {
            type: Number
          },
          endFrame: {
            type: Number
          },
          startPercent: {
            type: Number
          },
          currentPercent: {
            type: Number
          },
          endPercent: {
            type: Number
          },
          moves: [{
            frame: {
              type: Number
            },
            moveId: {
              type: Number
            },
            hitCount: {
              type: Number
            },
            damage: {
              type: Number
            }
          }],
          didKill: {
            type: Boolean
          },
          openingType: {
            type: String
          }
        }],
        inputCounts: {
          buttons: {
            type: Number
          },
          triggers: {
            type: Number
          },
          cstick: {
            type: Number
          },
          joystick: {
            type: Number
          },
          total: {
            type: Number
          }
        },
        conversionCount: {
          type: Number
        },
        totalDamage: {
          type: Number
        },
        killCount: {
          type: Number
        },
        successfulConversions: {
          type: Number
        },
        openings: {
          type: Number
        },
        neutralWins: {
          type: Number
        },
        counterHits: {
          type: Number
        },
        trades: {
          type: Number
        },
        deathCount: {
          type: Number
        },
        lcancelPercent: {
          type: Number
        },
        stocks: [{
          playerIndex: {
            type: Number
          },
          opponentIndex: {
            type: Number
          },
          startFrame: {
            type: Number
          },
          endFrame: {
            type: Number
          },
          startPercent: {
            type: Number
          },
          endPercent: {
            type: Number
          },
          currentPercent: {
            type: Number
          },
          count: {
            type: Number
          },
          deathAnimation: {
            type: Number
          }
        }]
      }]
    
    }
    )
  );

  return Match;
}