/* eslint-disable import/no-anonymous-default-export */
import React from 'react'
import Particles from 'react-tsparticles'
import { loadFull } from "tsparticles";

export default (props) => {
    const particlesInit = async (main) => { await loadFull(main) }
    if (props.permissions && props.permissions.view_particles) return (
        <Particles
            init={particlesInit}
            width='100vw'
            height='99.6vh'
            style={{ overflow: 'hidden', padding: '0', margin: '0' }}
            options={{
                background: {
                    color: {
                        value: "#2C2F33"
                    },
                },
                fpsLimit: 60,
                interactivity: {
                    detectsOn: "window",
                    events: {
                        onHover: {
                            enable: true,
                            mode: "attract"
                        },
                        onClick: {
                            enabled: true,
                            mode: 'attract'
                        }
                    },
                    modes: {
                        attract: {
                            quantity: .1
                        },
                        grab: {
                            distance: 150
                        }
                    }
                },
                particles: {
                    number: {
                        value: 60,
                    },
                    color: {
                        value: props.color
                    },
                    links: {
                        color: "#99AAB5",
                        distance: 50,
                        enable: true,
                        opacity: .5,
                        width: 1
                    },
                    move: {
                        enable: true,
                        speed: .3,
                        direction: 'random',
                        random: true
                    },
                }
            }}
        />
    )
    return <div style={{ overflow: 'hidden', width: '100vw', height: '100vh', background: '#2C2F33' }} />
}