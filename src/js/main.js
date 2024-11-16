import Choices from "choices.js";
import Swiper from 'swiper';
import { Navigation, Pagination } from 'swiper/modules';
import flatpickr from "flatpickr"
import { Russian } from "flatpickr/dist/l10n/ru.js"

document.addEventListener("DOMContentLoaded", () => {
    // календарь
    let calendars = [];

    document.querySelectorAll(".calendar-inline.range").forEach(input => {
        let calendar = flatpickr(input, {
            inline: false,
            //mode: "range",
            "locale": Russian,
            dateFormat: "d.m.Y",
            disableMobile: "true",
            onChange: function (instance) {
                !input.classList.contains('changed') && input.classList.add('changed');
                syncData(input);
            }
        });
        calendars.push(calendar)
    })


    let selectsStyled = []
    // выпадающий список
    if (document.querySelector('.js--select-style')) {
        document.querySelectorAll('.js--select-style').forEach(item => {
            let choices = new Choices(item, {
                allowHTML: true,
                allowHtmlUserInput: true,
                searchEnabled: true,
                itemSelectText: ''
            });
            selectsStyled.push(choices);

            item.addEventListener('choice', (e) => {
                !e.target.classList.contains('changed') && e.target.classList.add('changed');
            })
        })
    }

    // переключение траспорта в маршрутах
    if (document.querySelector('.route-tabs')) {
        document.querySelectorAll('.route-tabs__el:not(.active)').forEach(item => {
            item.addEventListener('click', (e) => {
                activateButton(e.target)
            })
        })
        document.querySelectorAll('.route-tabs__el:first-child').forEach(item => {
            item.click()
        })
    }

    function activateButton(button) {
        const container = button.closest('.route-tabs')
        const highlight = container.querySelector('.highlight');
        highlight.style.width = `${button.offsetWidth - 6}px`;
        highlight.style.transform = `translateX(${button.offsetLeft + 4}px)`;
        if (container.querySelector('.route-tabs__el.active')) {
            container.querySelector('.route-tabs__el.active').classList.remove('active')
        }
        button.classList.add('active');
    }

    // слайдеры
    if (document.querySelectorAll('.fleet-slider').length) {
        document.querySelectorAll('.fleet-slider').forEach(slider => {
            let next = slider.querySelector('.swiper-button-next')
            let prev = slider.querySelector('.swiper-button-prev')
            var swiper = new Swiper(slider, {
                modules: [Navigation, Pagination],
                loop: true,
                spaceBetween: 40,
                slidesPerView: 3,
                breakpoints: {
                    320: {
                        spaceBetween: 16,
                        slidesPerView: 1,
                    },
                    780: {
                        spaceBetween: 16,
                        slidesPerView: 4,
                    },
                    1024: {
                        spaceBetween: 40,
                        slidesPerView: 3,
                    },
                },
                navigation: {
                    nextEl: next,
                    prevEl: prev,
                },
            });
        })
    }
    if (document.querySelectorAll('.towns-slider').length) {
        document.querySelectorAll('.towns-slider').forEach(slider => {
            let next = slider.querySelector('.swiper-button-next')
            let prev = slider.querySelector('.swiper-button-prev')
            var swiper = new Swiper(slider, {
                modules: [Navigation, Pagination],
                loop: true,
                spaceBetween: 24,
                slidesPerView: 2,
                breakpoints: {
                    320: {
                        spaceBetween: 16,
                        slidesPerView: 2,
                    },
                    780: {
                        spaceBetween: 16,
                        slidesPerView: 3,
                    },
                    1024: {
                        spaceBetween: 24,
                        slidesPerView: 4,
                    },
                },
                navigation: {
                    nextEl: next,
                    prevEl: prev,
                },
            });
        })
    }
    if (document.querySelectorAll('.sight__slider').length) {
        document.querySelectorAll('.sight__slider').forEach(slider => {
            let next = slider.querySelector('.swiper-button-next')
            let prev = slider.querySelector('.swiper-button-prev')
            let pagination = slider.querySelector('.swiper-pagination')
            var swiper = new Swiper(slider, {
                modules: [Navigation, Pagination],
                loop: true,
                navigation: {
                    nextEl: next,
                    prevEl: prev,
                },
                pagination: {
                    el: pagination,
                    clickable: true,
                }
            });
        })
    }

    // маршрут
    let routeForms = [];

    let cityFrom;
    let cityTo;

    if (document.querySelectorAll('.route-form').length) {
        document.querySelectorAll('.route-form').forEach(item => {
            item.querySelectorAll('select').forEach(select =>
                select.addEventListener('change', (e) => {
                    syncSelects(e.target)
                })
            )
            item.querySelector('input').addEventListener('change', (e) => {
                (e.target.value.length > 0) ? e.target.classList.add('changed') : e.target.classList.remove('changed')
                syncData(e.target);
            })
        })
    }

    function syncData(input) {
        document.querySelectorAll('.route-form .calendar-inline.range').forEach(item => {
            item.value = input.value;
            item.classList.add('changed');
        })
        calendars.forEach(calendar => calendar.setDate(input.value))
    }

    function syncSelects(select) {
        if (select.classList.contains('js--from')) {
            selectsStyled.forEach((item, index) => {
                if (item.passedElement.element.classList.contains('js--from')) {
                    item.setChoiceByValue(select.value).refresh();
                    item.passedElement.element.classList.add('changed')
                    cityFrom = select.value
                }
            })
        }
        if (select.classList.contains('js--to')) {
            selectsStyled.forEach((item, index) => {
                if (item.passedElement.element.classList.contains('js--to')) {
                    item.setChoiceByValue(select.value).refresh();
                    item.passedElement.element.classList.add('changed')
                    cityTo = select.value
                }
            })
        }
        (cityFrom && cityTo) && updateRoute();
    }

    // карта
    let myMap, myRoute;
    if (document.querySelector('.js--route-map')) {
        ymaps.ready(init);

        function init() {
            myMap = new ymaps.Map("map", {
                center: [55.76, 37.64],
                zoom: 5,
                controls: []
            });

            myMap.controls.add("zoomControl", {
                position: {top: 10, right: 10}
            });
            myMap.behaviors.disable(["dblClickZoom", "rightMouseButtonMagnifier"]);

        }
    }

    function updateRoute() {
        if (myRoute) {
            myMap.geoObjects.remove(myRoute);
        }
        ymaps.geocode(cityFrom).then(function (res1) {
            const point1 = res1.geoObjects.get(0).geometry.getCoordinates();
            ymaps.geocode(cityTo).then(function (res2) {
                const point2 = res2.geoObjects.get(0).geometry.getCoordinates();

                ymaps.route([point1, point2]).then(function (route) {
                    myMap.geoObjects.removeAll(); // Удаляем старый маршрут
                    myMap.geoObjects.add(route);  // Добавляем новый маршрут

                    route.getWayPoints().options.set("draggable", false);

                    const distance = route.getHumanLength();
                    const duration = route.getHumanTime();

                    myMap.setBounds(route.getWayPoints().getBounds(), {
                        checkZoomRange: true,
                        zoomMargin: 20
                    });

                    document.querySelector('.route-modal__length .value').innerHTML = distance;
                    document.querySelector('.route-modal__time .value').innerHTML = duration;
                });
            });
        });
    }

    // табы
    const tabs = document.querySelectorAll('.tabs__caption')
    if (tabs.length) {
        tabs.forEach((tab) => {
            tab.addEventListener('click', function (event) {
                let target = event.target
                if (!target.classList.contains('active')) {
                    let containers = target.closest('.tabs').querySelectorAll('.containers');
                    let tabs = target.closest('.tabs__caption');

                    let tabsList = Array.from(tabs.children);
                    let index = tabsList.indexOf(target);

                    containers.forEach((container) => {
                        if (container.querySelector('li.active')) {
                            container.querySelector('li.active').classList.remove('active');
                        }
                        if (container.querySelector('.tabs__content.active')) {
                            container.querySelector('.tabs__content.active').classList.remove('active');
                        }
                        container.getElementsByClassName('tabs__content')[index].classList.add('active');
                    })
                    if (tabs.closest('.tabs__caption').querySelector('li.active')) {
                        tabs.closest('.tabs__caption').querySelector('li.active').classList.remove('active');
                    }
                    target.classList.add('active');
                }
            })
        });
    }

    // табы городов
    if (document.querySelectorAll('.js--change-town').length) {
        document.querySelectorAll('.js--change-town').forEach(town => {
            town.addEventListener('click', (e) => {
                let index = e.target.dataset.town;
                console.log(index)
                e.target.closest('.en-route').querySelector('.sight.active').classList.remove('active')
                e.target.closest('.en-route').querySelector('.sight[data-town="' + index + '"]').classList.add('active')
            })
        })
    }

    document.querySelector('.js--open-modal').addEventListener('click', (e) => {
        document.querySelector('body').classList.add('fixed');
        document.querySelector('.route-modal').classList.add('visible');
    })
    document.querySelector('.js--close-modal').addEventListener('click', (e) => {
        document.querySelector('body').classList.remove('fixed');
        document.querySelector('.route-modal').classList.remove('visible');
    })

    // мобильное меню
    document.querySelector('.js--mobile-menu').addEventListener('click', (e) => {
        if(window.innerWidth < 1023) {
            document.querySelector('.header__nav .nav').classList.toggle('open')
        }
    })
})
