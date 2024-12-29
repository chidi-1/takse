import Choices from "choices.js";
import Swiper from 'swiper';
import {Navigation, Pagination} from 'swiper/modules';
import flatpickr from "flatpickr"
import {Russian} from "flatpickr/dist/l10n/ru.js"
import {Fancybox} from "@fancyapps/ui";

document.addEventListener("DOMContentLoaded", () => {
    // открытие модалки при загрузке страницы
    const currentUrl = window.location.href;
    if (currentUrl.includes("?open=routemodal")) {
        Fancybox.show([
            {
                src: "#route-modal", // ID модалки
                type: "inline",
            }
        ]);
    }

    Fancybox.bind('[data-fancybox]', {
        dragToClose: false,
        touch: false,
        on: {
            ready: (fancybox) => {
                if (fancybox.userSlides[0].triggerEl.classList.contains('js--open-modal')) {
                    changeRouteUrl();
                }
            },
            destroy: (fancybox) => {
                if (fancybox.userSlides[0].triggerEl.dataset.src === '#route-modal') {
                    clearRouteUrl();
                }
            },
        }
    });

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

    let selectsStyled = [];
    let debounceTimer;
    // выпадающий список
    if (document.querySelector('.js--select-style')) {
        document.querySelectorAll('.js--select-style').forEach(item => {
            let choices = new Choices(item, {
                allowHTML: true,
                allowHtmlUserInput: true,
                searchEnabled: true,
                itemSelectText: '',
                noChoicesText: 'Начните вводить название города',
                noResultsText: 'Ничего не найдено'
            });
            selectsStyled.push(choices);

            // поиск городов при вводе в поле
            choices.passedElement.element.addEventListener(
                'search',
                function (event) {
                    clearTimeout(debounceTimer);
                    debounceTimer = setTimeout(async () => {
                        let value = event.detail.value;
                        if (value.length > 2) {
                            try {
                                const towns = await getTowns(value);
                                console.log(towns);

                                let townsForSelect = []
                                towns.length > 0 && towns.forEach(town => {
                                    townsForSelect.push({
                                        id: town.id,
                                        value: town.name,
                                        label: town.name,
                                        customProperties: {
                                            guid: town.guid,
                                        }
                                    })
                                })

                                syncSelectsValues(choices.passedElement.element, townsForSelect);

                            } catch (error) {
                                console.error('Ошибка при обработке запроса:', error);
                            }
                        }
                    }, 1000);
                },
                false,
            );

            choices.passedElement.element.addEventListener(
                'change',
                function (event) {
                    syncSelects(choices);
                }
            )

            item.addEventListener('choice', (e) => {
                !e.target.classList.contains('changed') && e.target.classList.add('changed');
            })
        })
    }

    // поиск городов
    async function getTowns(value) {
        // ЗАМЕНИТЬ endpoint

        try {
            const response = await fetch('https://cors-anywhere.herokuapp.com/http://bevolgayan.temp.swtest.ru/promo/takse/assets/towns.json', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({query: value})
            });

            if (!response.ok) {
                throw new Error(`Ошибка запроса: ${response.statusText}`);
            }

            const data = await response.json();
            return data.towns;

        } catch (error) {
            console.error('Ошибка при отправке запроса:', error);
        }
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
    let townsSlider;
    let sightSlidersList = []

    function initLibsAndEvents() {
        // табы городов
        if (document.querySelectorAll('.js--change-town').length) {
            document.querySelectorAll('.js--change-town').forEach(town => {
                town.addEventListener('click', (e) => {
                    let index = e.target.dataset.town;
                    e.target.closest('.en-route').querySelector('.sight.active').classList.remove('active')
                    e.target.closest('.en-route').querySelector('.sight[data-town="' + index + '"]').classList.add('active')
                })
            })
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
                townsSlider = new Swiper(slider, {
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
                sightSlidersList.push(swiper);
            })
        }
    }
    initLibsAndEvents();

    // маршрут
    let routeForms = [];

    let cityFrom;
    let cityFromGuid;
    let cityTo;
    let cityToGuid;

    if (document.querySelectorAll('.route-form').length) {
        document.querySelectorAll('.route-form').forEach(item => {
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

    function syncSelects(choice) {
        if (choice.passedElement.element.classList.contains('js--from')) {
            selectsStyled.forEach((item, index) => {
                if (item.passedElement.element.classList.contains('js--from')) {
                    item.setChoiceByValue(choice.getValue().value).refresh();
                    item.passedElement.element.classList.add('changed');
                    cityFrom = choice.getValue().value;
                    cityFromGuid = choice.getValue().customProperties.guid;
                }
            })
        }
        if (choice.passedElement.element.classList.contains('js--to')) {
            selectsStyled.forEach((item, index) => {
                if (item.passedElement.element.classList.contains('js--to')) {
                    item.setChoiceByValue(choice.getValue().value).refresh();
                    item.passedElement.element.classList.add('changed')
                    cityTo = choice.getValue().value;
                    cityToGuid = choice.getValue().customProperties.guid;
                }
            })
        }
        (cityFrom && cityTo) && updateRoute();
        (cityFrom && cityTo) && updateRouteInfo();
    }

    function syncSelectsValues(select, values) {
        if (select.classList.contains('js--from')) {
            selectsStyled.forEach((item, index) => {
                if (item.passedElement.element.classList.contains('js--from')) {
                    item.setChoices(
                        values,
                        'value',
                        'label',
                        false,
                    )
                }
            })
        }
        if (select.classList.contains('js--to')) {
            console.log(2)
            selectsStyled.forEach((item, index) => {
                if (item.passedElement.element.classList.contains('js--to')) {
                    item.setChoices(
                        values,
                        'value',
                        'label',
                        false,
                    )
                }
            })
        }
    }

    function changeRouteUrl() {
        let currentUrl = window.location.href;
        let addedUrl = '';
        if (cityFromGuid) addedUrl += `/${cityFromGuid}`;
        if (cityToGuid) addedUrl += `/${cityToGuid}`;

        history.replaceState(null, "", addedUrl)
    }

    function clearRouteUrl() {
        let currentUrl = window.location.href;
        let newUrl = '';

        if (cityFromGuid && cityToGuid) {

            const parts = currentUrl.split('/');
            newUrl = parts.slice(0, parts.length - 2).join('/');
        } else if (cityFromGuid && !cityToGuid) {
            const parts = currentUrl.split('/');
            newUrl = parts.slice(0, parts.length - 1).join('/');
        }

        history.replaceState(null, "", newUrl)
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
            myMap.behaviors.disable(["dblClickZoom", "rightMouseButtonMagnifier", "scrollZoom"]);

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

    // информация в модалке
    function  updateRouteInfo (){
        fetch('https://cors-anywhere.herokuapp.com/http://bevolgayan.temp.swtest.ru/promo/takse/assets/route-info.json', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                from: 'Москва',
                to: 'Новосибирск'
            })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Ошибка HTTP: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if(data.route.length > 0) {
                    console.log(generateTownInfo(data))

                    document.querySelector('.en-route.hidden').innerHTML = generateTownInfo(data);
                    document.querySelector('.en-route.hidden').classList.remove('hidden');

                    townsSlider && townsSlider.destroy(true, true);
                    sightSlidersList.length > 0 && sightSlidersList.forEach(sightSlider => sightSlider.destroy(true, true))
                    initLibsAndEvents();
                }

            })
            .catch(error => {
                console.error('Ошибка запроса:', error);
            });
    }



    // мобильное меню
    document.querySelector('.js--mobile-menu').addEventListener('click', (e) => {
        if (window.innerWidth < 1023) {
            document.querySelector('.header__nav .nav').classList.toggle('open')
        }
    })

    // создание разметки для модалки
    function generateTownInfo(json) {
        const wrapper = document.createElement('div');

        // Заголовок
        const header = document.createElement('h3');
        header.className = 'h3';
        header.innerHTML = 'Города и&nbsp;достопримечательности в&nbsp;дороге';
        wrapper.appendChild(header);

        // Города
        const townsContainer = document.createElement('div');
        townsContainer.className = 'en-route__towns';

        const townsSlider = document.createElement('div');
        townsSlider.className = 'towns-slider swiper-initialized swiper-horizontal swiper-backface-hidden';

        const swiperWrapper = document.createElement('div');
        swiperWrapper.className = 'swiper-wrapper';

        json.route.forEach((town, index) => {
            const swiperSlide = document.createElement('div');
            swiperSlide.className = `swiper-slide ${index === 0 ? 'swiper-slide-active' : ''}`;
            swiperSlide.dataset.swiperSlideIndex = index;

            const townEl = document.createElement('div');
            townEl.className = 'towns-slider__el js--change-town';
            townEl.dataset.town = index + 1;

            const bg = document.createElement('div');
            bg.className = 'towns-slider__bg';

            const img = document.createElement('img');
            img.src = town.photo;
            img.alt = `Название города ${town.name}`;
            bg.appendChild(img);

            const span = document.createElement('span');
            span.className = 'towns-slider__name';
            span.textContent = town.name;
            bg.appendChild(span);

            townEl.appendChild(bg);

            const button = document.createElement('button');
            button.className = 'button button-blue';
            button.tabIndex = -1;
            button.textContent = 'Подробнее';
            townEl.appendChild(button);

            swiperSlide.appendChild(townEl);
            swiperWrapper.appendChild(swiperSlide);
        });

        townsSlider.appendChild(swiperWrapper);
        townsContainer.appendChild(townsSlider);
        wrapper.appendChild(townsContainer);

        // Достопримечательности
        const sightsContainer = document.createElement('div');
        sightsContainer.className = 'en-route__sights';

        json.route.forEach((town, townIndex) => {
            const tab = document.createElement('div');
            tab.className = `tabs sight ${townIndex === 0 ? 'active' : ''}`;
            tab.dataset.town = townIndex + 1;

            const townHeader = document.createElement('h3');
            townHeader.className = 'h3';
            townHeader.textContent = town.name;
            tab.appendChild(townHeader);

            const topContainer = document.createElement('div');
            topContainer.className = 'sight__top';

            const tabsCaption = document.createElement('ul');
            tabsCaption.className = 'tabs__caption';

            town.sights.forEach((sight, sightIndex) => {
                const li = document.createElement('li');
                if (sightIndex === 0) li.className = 'active';
                li.textContent = sight.name;
                tabsCaption.appendChild(li);
            });

            topContainer.appendChild(tabsCaption);

            const sightPhotos = document.createElement('div');
            sightPhotos.className = 'sight__photos containers';

            town.sights.forEach((sight, sightIndex) => {
                const tabsContent = document.createElement('div');
                tabsContent.className = `tabs__content ${sightIndex === 0 ? 'active' : ''}`;

                const sightSlider = document.createElement('div');
                sightSlider.className = 'sight__slider';

                const swiperWrapper = document.createElement('div');
                swiperWrapper.className = 'swiper-wrapper';

                sight.photos.forEach((photo, photoIndex) => {
                    const swiperSlide = document.createElement('div');
                    swiperSlide.className = `swiper-slide ${photoIndex === 0 ? 'swiper-slide-active' : ''}`;
                    swiperSlide.dataset.swiperSlideIndex = photoIndex;

                    const img = document.createElement('img');
                    img.src = photo;
                    img.alt = `Фото`;
                    swiperSlide.appendChild(img);
                    swiperWrapper.appendChild(swiperSlide);
                });

                const nextButton = document.createElement('div');
                nextButton.className = 'swiper-button-next';
                nextButton.innerHTML = `<svg width="13" height="12">
                                <use xlink:href="/src/assets/img/sprite.svg#arrow-right"></use>
                            </svg>`

                const prevButton = document.createElement('div');
                prevButton.className = 'swiper-button-prev';
                prevButton.innerHTML = `<svg width="13" height="12">
                                <use xlink:href="/src/assets/img/sprite.svg#arrow-left"></use>
                            </svg>`

                const pagination = document.createElement('div');
                pagination.className = 'swiper-pagination';

                sightSlider.appendChild(swiperWrapper);
                sightSlider.appendChild(nextButton)
                sightSlider.appendChild(prevButton)
                sightSlider.appendChild(pagination)
                tabsContent.appendChild(sightSlider);
                sightPhotos.appendChild(tabsContent);
            });

            topContainer.appendChild(sightPhotos);
            tab.appendChild(topContainer);

            const sightDescription = document.createElement('div');
            sightDescription.className = 'sight__description containers';

            town.sights.forEach((sight, sightIndex) => {
                const tabsContent = document.createElement('div');
                tabsContent.className = `tabs__content ${sightIndex === 0 ? 'active' : ''}`;

                const paragraph = document.createElement('p');
                paragraph.textContent = sight.description;
                tabsContent.appendChild(paragraph);
                sightDescription.appendChild(tabsContent);
            });

            tab.appendChild(sightDescription);
            sightsContainer.appendChild(tab);
        });

        wrapper.appendChild(sightsContainer);

        return wrapper.outerHTML;
    }

})
